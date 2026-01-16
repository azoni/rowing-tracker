const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Constants
const VERIFICATION_THRESHOLDS = {
  CONFIDENCE_HIGH: 85,
  CONFIDENCE_MEDIUM: 60,
};

/**
 * Generate SHA-256 hash of image data
 */
const generateImageHash = (imageBuffer) => {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
};

/**
 * Check for duplicate images
 */
const checkDuplicateImage = async (imageHash) => {
  const duplicates = await db.collection('entries')
    .where('verificationDetails.imageHash', '==', imageHash)
    .limit(1)
    .get();
  
  return !duplicates.empty;
};

/**
 * Call Claude API directly using fetch
 */
const verifyWithClaude = async (imageBase64, claimedMeters) => {
  const apiKey = functions.config().anthropic?.api_key;
  if (!apiKey) {
    console.error('Anthropic API key not configured');
    return { success: false, error: 'API key not configured' };
  }

  const isExtractionMode = !claimedMeters || claimedMeters === 0;
  
  const prompt = isExtractionMode 
    ? `You are analyzing a rowing machine display photo. Extract the distance in meters shown on the display.

Respond in this EXACT JSON format only:
{
  "isRowingMachineDisplay": true/false,
  "displayType": "Concept2 PM5" or "WaterRower" or "Generic" or "Unknown" or "Not a rowing machine",
  "extractedMeters": number or null,
  "overallConfidence": 0-100,
  "reasoning": "Brief explanation"
}

Look for the main distance display (usually the largest number, 3-5 digits). Respond ONLY with JSON.`
    : `You are verifying a rowing machine display photo. The user claims: ${claimedMeters} meters.

Respond in this EXACT JSON format only:
{
  "isRowingMachineDisplay": true/false,
  "displayType": "Concept2 PM5" or "WaterRower" or "Generic" or "Unknown",
  "extractedMeters": number or null,
  "matchesClaimed": true/false,
  "overallConfidence": 0-100,
  "reasoning": "Brief explanation"
}

Respond ONLY with JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return { success: true, ...result };
    }
    
    return { success: false, error: 'Could not parse response' };
  } catch (error) {
    console.error('Claude verification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Main verification Cloud Function
 */
exports.verifyRowEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { imageBase64, claimedMeters } = data;
  
  if (!imageBase64) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing image data');
  }
  
  const isExtractionMode = !claimedMeters || claimedMeters === 0;
  
  try {
    // Generate hash and check for duplicates
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const imageHash = generateImageHash(imageBuffer);
    const isDuplicate = await checkDuplicateImage(imageHash);
    
    if (isDuplicate) {
      return {
        status: 'duplicate',
        reason: 'This image has already been used',
        imageHash,
        confidence: 0,
      };
    }
    
    // Claude Vision verification
    const claudeResult = await verifyWithClaude(imageBase64, claimedMeters);
    
    if (!claudeResult.success) {
      return {
        status: 'pending_review',
        reason: claudeResult.error || 'AI verification failed',
        imageHash,
        confidence: 0,
        isRowingMachineDisplay: null,
      };
    }
    
    // Return extraction result
    return {
      status: isExtractionMode ? 'extracted' : (claudeResult.overallConfidence >= VERIFICATION_THRESHOLDS.CONFIDENCE_MEDIUM ? 'verified' : 'pending_review'),
      imageHash,
      confidence: claudeResult.overallConfidence || 0,
      extractedMeters: claudeResult.extractedMeters,
      displayType: claudeResult.displayType,
      isRowingMachineDisplay: claudeResult.isRowingMachineDisplay,
      matchesClaimed: claudeResult.matchesClaimed,
      reasoning: claudeResult.reasoning,
    };
    
  } catch (error) {
    console.error('Verification error:', error);
    throw new functions.https.HttpsError('internal', 'Verification failed');
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
    });
    
    if (metersDiff !== 0) {
      await db.collection('users').doc(entry.userId).update({
        totalMeters: admin.firestore.FieldValue.increment(metersDiff),
      });
    }
    
    return { success: true, action: 'approved' };
    
  } else {
    // Reject - revert user stats
    await entryRef.update({
      verificationStatus: 'rejected',
      reviewedBy: context.auth.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNote: reviewNote || null,
    });
    
    await db.collection('users').doc(entry.userId).update({
      totalMeters: admin.firestore.FieldValue.increment(-entry.meters),
      uploadCount: admin.firestore.FieldValue.increment(-1),
    });
    
    return { success: true, action: 'rejected' };
  }
});

/**
 * Get verification stats
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
