const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Fire-and-forget activity logger — logs to portfolio Firestore and MCP.
function logActivity({ type, title, description, model, tokens, cost, metadata }) {
  const https = require('https');

  // Write to portfolio Firestore (primary — what the dashboard reads)
  const webhookSecret = functions.config().portfolio?.webhook_secret;
  if (webhookSecret) {
    const portfolioPayload = JSON.stringify({
      type, title, source: 'rowcrew',
      description: description || '', model, tokens, cost, metadata,
      secret: webhookSecret,
    });
    const pReq = https.request({
      hostname: 'azoni.netlify.app',
      path: '/.netlify/functions/log-agent-activity',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(portfolioPayload),
      },
    });
    pReq.on('error', (e) => console.error('[activity-log] Portfolio write failed:', e.message));
    pReq.write(portfolioPayload);
    pReq.end();
  }

  // Also forward to MCP
  const mcpKey = functions.config().mcp?.admin_key;
  if (mcpKey) {
    const payload = JSON.stringify({
      type, title, source: 'rowcrew',
      description: description || '', model, tokens, cost, metadata,
    });
    const req = https.request({
      hostname: 'azoni-mcp.onrender.com',
      path: '/activity/log',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mcpKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    });
    req.on('error', (e) => console.error('[activity-log] MCP write failed:', e.message));
    req.write(payload);
    req.end();
  }
}

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

  // Query past AI corrections for learning context
  let learningContext = '';
  try {
    const feedbackQuery = admin.firestore()
      .collection('ai_feedback')
      .where('corrections.meters', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10);
    const feedbackSnap = await feedbackQuery.get();

    if (!feedbackSnap.empty) {
      const corrections = feedbackSnap.docs.map(doc => {
        const d = doc.data();
        return `- Display type "${d.aiExtracted?.displayType || 'unknown'}", machine "${d.machine?.displayName || 'unknown'}": AI read ${d.aiExtracted?.meters}m but correct was ${d.userConfirmed?.meters}m` +
          (d.userConfirmed?.time ? `, time was ${d.userConfirmed.time}s` : '') +
          (d.userConfirmed?.calories ? `, calories was ${d.userConfirmed.calories}` : '');
      });
      learningContext = `\n\nLearning from past corrections (use these to improve accuracy):\n${corrections.join('\n')}`;
    }
  } catch (e) {
    console.log('Could not load feedback:', e.message);
  }

  const extractionHints = `
CRITICAL display reading rules:

CONCEPT2 PM5 DISPLAY LAYOUTS:
The PM5 has multiple screens. You MUST identify which screen is shown:

1. SUMMARY SCREEN (after workout): Shows total distance (large, e.g. "2000m"), total time, avg pace, avg stroke rate, calories. This is the most common photo.

2. INTERVAL/WORKOUT IN-PROGRESS SCREEN: Shows current interval data. Look for "Interval" label.
   - If you see "Interval 1" or "Interval 2" etc, this is an interval workout
   - The time at top may be TIME REMAINING, not elapsed time
   - The distance shown is the TARGET DISTANCE per interval (e.g., 500m intervals)
   - The pace shown (e.g., "1:58.6 ave /500") is the average pace FOR THAT INTERVAL
   - The "s/m" value is stroke rate

3. JUST ROW SCREEN: Shows running distance, time, pace, stroke rate as you row

4. WORKOUT RESULTS: Shows summary with all intervals listed

KEY READING RULES:
- A time like ":26" or ":26r" means 26 seconds REMAINING, not elapsed time
- "ave /500" means average pace per 500 meters
- If "Interval" is visible, determine the interval distance from context
- For interval workouts: extractedMeters = interval distance (e.g., 500), extractedTime = convert the pace to total time for that distance
- If pace is "1:58.6 /500" and distance is 500m, then time = 118.6 seconds (1 min 58.6 sec)
- Stroke rate labeled "s/m" or "SPM", typically 18-40

WATERROWER S4: Shows distance, time, intensity. Distance is usually the large number.

GENERAL RULES:
- Convert all times to total seconds (e.g., "25:30.0" = 1530, "1:58.6" = 118.6)
- Distance is in meters
- Calories labeled "Cal"
- If you can determine the workout type (single distance, time, intervals), include it`;

  const jsonFormat = `{
  "isRowingMachineDisplay": true/false,
  "displayType": "Concept2 PM5" or "WaterRower S4" or "Generic" or "Unknown" or "Not a rowing machine",
  "extractedMeters": total meters rowed (number or null),
  "extractedTime": total elapsed time in seconds (number or null),
  "extractedCalories": number or null,
  "extractedSplitPace": "M:SS.s per 500m" string or null,
  "extractedStrokeRate": number (strokes per minute) or null,
  "machineModel": specific model string or null,
  "workoutType": "single_distance" or "single_time" or "interval" or "just_row" or "unknown",
  "intervalInfo": { "count": number, "distance": meters_per_interval, "currentInterval": number } or null,
  "overallConfidence": 0-100,
  "reasoning": "Explain what screen you see and how you determined each value"
}`;

  const prompt = isExtractionMode
    ? `You are an expert at reading rowing machine displays. Analyze this photo carefully.
${extractionHints}

Respond in this EXACT JSON format only:
${jsonFormat}

IMPORTANT: Explain your reasoning. If this is an interval workout showing "Interval 1" with a pace of "1:58.6 /500" and you can see the interval is 500m, then extractedMeters=500 and extractedTime=118.6. Think step by step about what each number on the display means.

Respond ONLY with valid JSON.${learningContext}`
    : `You are an expert at reading rowing machine displays. The user claims: ${claimedMeters} meters. Analyze this photo carefully.
${extractionHints}

Respond in this EXACT JSON format only:
${jsonFormat.replace('"overallConfidence"', '"matchesClaimed": true/false,\n  "overallConfidence"')}

Respond ONLY with valid JSON.${learningContext}`;

  const selectedModel = 'claude-sonnet-4-20250514';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 800,
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
    
    // Extract usage for activity logging
    const usage = data.usage || {};
    // Claude Sonnet 4: $3.00/$15.00 per 1M tokens
    const inputCost = (usage.input_tokens || 0) / 1e6 * 3.00;
    const outputCost = (usage.output_tokens || 0) / 1e6 * 15.00;
    const totalCost = inputCost + outputCost;

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);

      // Log to activity feed
      logActivity({
        type: 'row_verified',
        title: isExtractionMode
          ? `Extracted: ${result.extractedMeters || '?'}m`
          : `Verified: ${claimedMeters}m ${result.matchesClaimed ? '✓' : '✗'}`,
        description: `${result.displayType || 'Unknown display'}, ${result.overallConfidence}% confidence, ${selectedModel}`,
        reasoning: result.reasoning || '',
        model: selectedModel,
        tokens: {
          prompt: usage.input_tokens || 0,
          completion: usage.output_tokens || 0,
          total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        },
        cost: totalCost,
        metadata: {
          extractedMeters: result.extractedMeters,
          claimedMeters: claimedMeters || null,
          confidence: result.overallConfidence,
          displayType: result.displayType,
          matched: result.matchesClaimed ?? null,
        },
      });

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
      extractedTime: claudeResult.extractedTime || null,
      extractedCalories: claudeResult.extractedCalories || null,
      extractedSplitPace: claudeResult.extractedSplitPace || null,
      extractedStrokeRate: claudeResult.extractedStrokeRate || null,
      machineModel: claudeResult.machineModel || null,
      workoutType: claudeResult.workoutType || null,
      intervalInfo: claudeResult.intervalInfo || null,
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
 * Delete own entry
 */
exports.deleteEntry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { entryId } = data;

  if (!entryId) {
    throw new functions.https.HttpsError('invalid-argument', 'Entry ID required');
  }

  const entryRef = db.collection('entries').doc(entryId);
  const entryDoc = await entryRef.get();

  if (!entryDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Entry not found');
  }

  const entry = entryDoc.data();

  if (entry.userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You can only delete your own entries');
  }

  // Revert user stats
  await db.collection('users').doc(entry.userId).update({
    totalMeters: admin.firestore.FieldValue.increment(-entry.meters),
    uploadCount: admin.firestore.FieldValue.increment(-1),
  });

  await entryRef.delete();

  return { success: true };
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

// Forward group/challenge activities to the ecosystem activity feed
exports.forwardActivity = functions.firestore
  .document('activities/{activityId}')
  .onCreate((snap) => {
    const data = snap.data();
    const type = data.type;
    // row_completed is handled by the client-side log-activity Netlify function
    if (type === 'row_completed') return null;
    const titles = {
      group_created: `Group created: ${data.groupName || 'group'}`,
      group_joined: `Joined group: ${data.groupName || 'group'}`,
      challenge_created: `Challenge created: ${data.challengeName || 'challenge'}`,
      admin_transferred: `Admin transferred in ${data.groupName || 'group'}`,
    };
    const title = titles[type];
    if (!title) return null;
    logActivity({ type, title, description: `RowCrew ${type.replace('_', ' ')}` });
    return null;
  });

// Admin: delete any feed item (bypasses Firestore rules via admin SDK)
exports.adminDeleteFeedItem = functions.https.onCall(async (data, context) => {
  // Verify authenticated admin
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || !callerDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { itemId, itemType } = data;
  if (!itemId || !itemType) throw new functions.https.HttpsError('invalid-argument', 'Missing itemId or itemType');

  try {
    // Row entries
    if (itemType === 'row') {
      const entryRef = db.collection('entries').doc(itemId);
      const entrySnap = await entryRef.get();
      if (entrySnap.exists) {
        const entry = entrySnap.data();
        // Revert user stats
        const userRef = db.collection('users').doc(entry.userId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const user = userSnap.data();
          await userRef.update({
            totalMeters: Math.max(0, (user.totalMeters || 0) - (entry.meters || 0)),
            totalTime: Math.max(0, (user.totalTime || 0) - (entry.time || 0)),
            totalCalories: Math.max(0, (user.totalCalories || 0) - (entry.calories || 0)),
            uploadCount: Math.max(0, (user.uploadCount || 0) - 1),
          });
        }
        await entryRef.delete();
        return { success: true, message: 'Entry deleted' };
      }
    }

    // Activities collection
    const activityRef = db.collection('activities').doc(itemId);
    const activitySnap = await activityRef.get();
    if (activitySnap.exists) {
      await activityRef.delete();
      return { success: true, message: 'Activity deleted' };
    }

    // Rank events (ID format: rank-{userId}-{index})
    if (itemType === 'rank' && itemId.startsWith('rank-')) {
      const parts = itemId.split('-');
      const rankIndex = parseInt(parts[parts.length - 1], 10);
      const userId = parts.slice(1, -1).join('-');
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists && userSnap.data().rankHistory && !isNaN(rankIndex)) {
        const history = [...userSnap.data().rankHistory];
        if (rankIndex < history.length) {
          history.splice(rankIndex, 1);
          await userRef.update({ rankHistory: history });
          return { success: true, message: 'Rank event removed' };
        }
      }
    }

    // Achievement events (ID format: achievement-{userId}-{dayKey})
    if (itemType === 'achievement' && itemId.startsWith('achievement-')) {
      const parts = itemId.split('-');
      const dayKey = parts[parts.length - 3] + '-' + parts[parts.length - 2] + '-' + parts[parts.length - 1];
      const userId = parts.slice(1, -3).join('-');
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists && userSnap.data().unlockedAchievements) {
        const updated = { ...userSnap.data().unlockedAchievements };
        let removed = false;
        Object.entries(updated).forEach(([achievementId, dateStr]) => {
          const d = new Date(dateStr);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (key === dayKey) { delete updated[achievementId]; removed = true; }
        });
        if (removed) {
          await userRef.update({ unlockedAchievements: updated });
          return { success: true, message: 'Achievement event removed' };
        }
      }
    }

    return { success: false, message: 'Item not found' };
  } catch (error) {
    console.error('Admin delete error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});