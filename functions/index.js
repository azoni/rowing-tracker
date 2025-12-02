const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Lazy load Anthropic SDK (only when needed)
let anthropicClient = null;
const getAnthropicClient = () => {
  if (!anthropicClient) {
    const Anthropic = require('@anthropic-ai/sdk');
    const apiKey = functions.config().anthropic?.api_key;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Run: firebase functions:config:set anthropic.api_key="your-key"');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
};

// Constants
const VERIFICATION_THRESHOLDS = {
  CONFIDENCE_HIGH: 85,
  CONFIDENCE_MEDIUM: 60,
  CONFIDENCE_LOW: 40,
  METERS_TOLERANCE: 0.10,
};

const BEHAVIORAL_LIMITS = {
  MAX_METERS_PER_SESSION: 50000,
  MAX_ENTRIES_PER_DAY: 10,
  SUSPICIOUS_INCREASE_PERCENT: 200,
};

/**
 * Generate SHA-256 hash of image data
 */
const generateImageHash = (imageBuffer) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
};

/**
 * Check for duplicate images
 */
const checkDuplicateImage = async (imageHash) => {
  const duplicates = await db.collection('entries')
    .where('imageHash', '==', imageHash)
    .limit(1)
    .get();
  
  return !duplicates.empty;
};

/**
 * Check behavioral patterns for suspicious activity
 */
const checkBehavioralPatterns = async (userId, claimedMeters) => {
  const flags = [];
  
  const recentEntries = await db.collection('entries')
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .limit(50)
    .get();
  
  const entries = recentEntries.docs.map(doc => doc.data());
  
  // Check entries today
  const today = new Date().toDateString();
  const entriesToday = entries.filter(e => 
    new Date(e.date).toDateString() === today
  ).length;
  
  if (entriesToday >= BEHAVIORAL_LIMITS.MAX_ENTRIES_PER_DAY) {
    flags.push(`Too many entries today (${entriesToday})`);
  }
  
  // Check physically impossible meters
  if (claimedMeters > BEHAVIORAL_LIMITS.MAX_METERS_PER_SESSION) {
    flags.push(`Meters exceed maximum possible (${claimedMeters}m)`);
  }
  
  // Check suspicious increase from average
  if (entries.length >= 5) {
    const avgMeters = entries.reduce((sum, e) => sum + (e.meters || 0), 0) / entries.length;
    const increasePercent = ((claimedMeters - avgMeters) / avgMeters) * 100;
    
    if (increasePercent > BEHAVIORAL_LIMITS.SUSPICIOUS_INCREASE_PERCENT) {
      flags.push(`Unusual increase from average (${Math.round(increasePercent)}% higher)`);
    }
  }
  
  return {
    passed: flags.length === 0,
    flags,
  };
};

/**
 * Use Claude Vision to verify the rowing machine display
 */
const verifyWithClaude = async (imageBase64, claimedMeters) => {
  const anthropic = getAnthropicClient();
  
  const prompt = `You are verifying a rowing machine display photo for an exercise tracking app. Your job is to:

1. IDENTIFY: Is this a legitimate photo of a rowing machine display/monitor?
2. EXTRACT: What distance (in meters) is shown on the display?
3. VERIFY: Does the extracted number match or closely match the claimed distance?
4. ASSESS: Rate your confidence in this verification.

The user claims they rowed: ${claimedMeters} meters

Please analyze this image and respond in this EXACT JSON format:
{
  "isRowingMachineDisplay": true/false,
  "displayType": "Concept2 PM5" or "WaterRower" or "Generic" or "Unknown" or "Not a rowing machine",
  "extractedMeters": number or null if unreadable,
  "metersConfidence": 0-100,
  "matchesClaimed": true/false,
  "metersDifference": number (absolute difference),
  "overallConfidence": 0-100,
  "concerns": ["list", "of", "concerns"] or [],
  "reasoning": "Brief explanation of your analysis"
}

Important notes:
- Look for the main distance/meters display (usually the largest number)
- Rowing machines show various stats: time, distance, pace, calories, strokes
- Distance is usually in meters and is typically a 4-5 digit number
- Common displays: Concept2 (black screen, white/green text), WaterRower (various), gym machines
- Be generous with matching - OCR differences of a few percent are acceptable
- Flag obvious issues: screenshots, edited images, non-rowing displays, illegible numbers

Respond ONLY with the JSON object, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].text;
    
    try {
      const result = JSON.parse(responseText);
      return { success: true, ...result };
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { success: true, ...JSON.parse(jsonMatch[0]) };
      }
      throw new Error('Could not parse Claude response');
    }
  } catch (error) {
    console.error('Claude verification error:', error);
    return {
      success: false,
      error: error.message,
      overallConfidence: 0,
      concerns: ['AI verification failed'],
    };
  }
};

/**
 * Determine final verification status
 */
const determineVerificationStatus = (claudeResult, behavioralResult, isDuplicate) => {
  if (isDuplicate) {
    return { status: 'rejected', reason: 'Duplicate image detected', requiresReview: false };
  }
  
  if (!claudeResult.success) {
    return { status: 'pending_review', reason: 'AI verification failed - manual review required', requiresReview: true };
  }
  
  if (!claudeResult.isRowingMachineDisplay) {
    return { status: 'rejected', reason: 'Image does not appear to be a rowing machine display', requiresReview: true };
  }
  
  if (claudeResult.extractedMeters && !claudeResult.matchesClaimed) {
    const tolerance = claudeResult.extractedMeters * VERIFICATION_THRESHOLDS.METERS_TOLERANCE;
    if (Math.abs(claudeResult.metersDifference) > tolerance) {
      return {
        status: 'pending_review',
        reason: `Claimed meters (${claudeResult.metersDifference}m difference) don't match display`,
        requiresReview: true,
        suggestedMeters: claudeResult.extractedMeters,
      };
    }
  }
  
  const confidence = claudeResult.overallConfidence || 0;
  
  if (confidence >= VERIFICATION_THRESHOLDS.CONFIDENCE_HIGH) {
    return {
      status: 'verified',
      reason: behavioralResult.passed ? 'High confidence verification' : 'Verified with behavioral flags',
      flags: behavioralResult.flags,
      requiresReview: false,
    };
  }
  
  if (confidence >= VERIFICATION_THRESHOLDS.CONFIDENCE_MEDIUM) {
    if (!behavioralResult.passed) {
      return { status: 'pending_review', reason: 'Medium confidence with behavioral flags', flags: behavioralResult.flags, requiresReview: true };
    }
    return { status: 'verified', reason: 'Medium confidence verification', requiresReview: false };
  }
  
  return { status: 'pending_review', reason: 'Low confidence - manual review required', requiresReview: true };
};

/**
 * Main verification Cloud Function
 */
exports.verifyRowEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userId = context.auth.uid;
  const { imageBase64, claimedMeters } = data;
  
  if (!imageBase64 || !claimedMeters) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  try {
    // Convert base64 to buffer for hashing
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Generate hash and check for duplicates
    const imageHash = generateImageHash(imageBuffer);
    const isDuplicate = await checkDuplicateImage(imageHash);
    
    // Check behavioral patterns
    const behavioralResult = await checkBehavioralPatterns(userId, claimedMeters);
    
    // Claude Vision verification
    const claudeResult = await verifyWithClaude(imageBase64, claimedMeters);
    
    // Determine final status
    const verification = determineVerificationStatus(claudeResult, behavioralResult, isDuplicate);
    
    return {
      status: verification.status,
      reason: verification.reason,
      requiresReview: verification.requiresReview,
      imageHash,
      confidence: claudeResult.overallConfidence || 0,
      extractedMeters: claudeResult.extractedMeters,
      displayType: claudeResult.displayType,
      flags: [...(verification.flags || []), ...(claudeResult.concerns || [])],
      suggestedMeters: verification.suggestedMeters,
      claudeReasoning: claudeResult.reasoning,
    };
    
  } catch (error) {
    console.error('Verification error:', error);
    throw new functions.https.HttpsError('internal', 'Verification failed: ' + error.message);
  }
});

/**
 * Admin: Get entries pending review
 */
exports.getPendingReviews = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const pendingEntries = await db.collection('entries')
    .where('verificationStatus', '==', 'pending_review')
    .orderBy('date', 'desc')
    .limit(50)
    .get();
  
  const entries = [];
  for (const doc of pendingEntries.docs) {
    const entry = doc.data();
    const userDocSnap = await db.collection('users').doc(entry.userId).get();
    entries.push({
      id: doc.id,
      ...entry,
      userName: userDocSnap.exists ? userDocSnap.data().name : 'Unknown',
    });
  }
  
  return { entries };
});

/**
 * Admin: Approve or reject an entry
 */
exports.reviewEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { entryId, action, adjustedMeters, reviewNote } = data;
  
  if (!entryId || !action || !['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid arguments');
  }
  
  const entryRef = db.collection('entries').doc(entryId);
  const entryDoc = await entryRef.get();
  
  if (!entryDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Entry not found');
  }
  
  const entry = entryDoc.data();
  
  if (action === 'approve') {
    const finalMeters = adjustedMeters || entry.meters;
    const metersDiff = finalMeters - entry.meters;
    
    await entryRef.update({
      verificationStatus: 'verified',
      meters: finalMeters,
      reviewedBy: context.auth.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNote: reviewNote || null,
      metersAdjusted: metersDiff !== 0,
    });
    
    if (metersDiff !== 0) {
      const userRef = db.collection('users').doc(entry.userId);
      await userRef.update({
        totalMeters: admin.firestore.FieldValue.increment(metersDiff),
      });
    }
    
    return { success: true, action: 'approved', finalMeters };
    
  } else {
    await entryRef.update({
      verificationStatus: 'rejected',
      reviewedBy: context.auth.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNote: reviewNote || null,
    });
    
    const userRef = db.collection('users').doc(entry.userId);
    await userRef.update({
      totalMeters: admin.firestore.FieldValue.increment(-entry.meters),
      uploadCount: admin.firestore.FieldValue.increment(-1),
    });
    
    return { success: true, action: 'rejected' };
  }
});

/**
 * Get verification stats (for admin dashboard)
 */
exports.getVerificationStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const [verified, pending, rejected] = await Promise.all([
    db.collection('entries').where('verificationStatus', '==', 'verified').count().get(),
    db.collection('entries').where('verificationStatus', '==', 'pending_review').count().get(),
    db.collection('entries').where('verificationStatus', '==', 'rejected').count().get(),
  ]);
  
  return {
    verified: verified.data().count,
    pending: pending.data().count,
    rejected: rejected.data().count,
  };
});