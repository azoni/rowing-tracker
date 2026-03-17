import React from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { formatMeters } from '../utils';
import Icon from './Icon';

export function CreateGroupModal() {
  const {
    showCreateGroupModal, setShowCreateGroupModal,
    newGroupName, setNewGroupName,
    newGroupDescription, setNewGroupDescription,
    groupError, handleCreateGroup, isCreatingGroup,
  } = useApp();

  if (!showCreateGroupModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
      <div className="modal group-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowCreateGroupModal(false)}>✕</button>

        <h2>Create Group</h2>
        <p>Create a private group for your crew</p>

        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            placeholder="e.g., Redeemer Rowers"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            placeholder="What's this group about?"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            maxLength={100}
            rows={2}
          />
        </div>

        {groupError && <div className="form-error">{groupError}</div>}

        <button
          className="primary-btn"
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim() || isCreatingGroup}
        >
          {isCreatingGroup ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
}

export function JoinGroupModal() {
  const {
    showJoinGroupModal, setShowJoinGroupModal,
    joinGroupCode, setJoinGroupCode,
    groupError, handleJoinGroup, isJoiningGroup,
  } = useApp();

  if (!showJoinGroupModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowJoinGroupModal(false)}>
      <div className="modal group-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowJoinGroupModal(false)}>✕</button>

        <h2>Join Group</h2>
        <p>Enter the invite code to join a group</p>

        <div className="form-group">
          <label>Invite Code</label>
          <input
            type="text"
            placeholder="e.g., ABC123"
            value={joinGroupCode}
            onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.25rem' }}
          />
        </div>

        {groupError && <div className="form-error">{groupError}</div>}

        <button
          className="primary-btn"
          onClick={handleJoinGroup}
          disabled={joinGroupCode.length < 6 || isJoiningGroup}
        >
          {isJoiningGroup ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}

export function InviteUserModal() {
  const {
    showInviteUserModal, setShowInviteUserModal,
    inviteUsername, setInviteUsername,
    searchUsers, selectedGroupId, getSelectedGroup,
    groupError,
  } = useApp();

  if (!showInviteUserModal || !selectedGroupId) return null;

  return (
    <div className="modal-overlay" onClick={() => { setShowInviteUserModal(false); setInviteUsername(''); }}>
      <div className="modal group-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { setShowInviteUserModal(false); setInviteUsername(''); }}>✕</button>

        <h2>Invite User</h2>
        <p>Add someone to {getSelectedGroup()?.name}</p>

        <div className="form-group">
          <label>Search by name or username</label>
          <input
            type="text"
            placeholder="Start typing..."
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            className="search-input-full"
            autoFocus
          />
        </div>

        {/* Search Results */}
        <div className="invite-search-results">
          {inviteUsername.length === 0 && (
            <div className="invite-search-hint">Type to search for users</div>
          )}

          {inviteUsername.length > 0 && searchUsers(inviteUsername).length === 0 && (
            <div className="invite-search-status">No users found</div>
          )}

          {searchUsers(inviteUsername).map(user => (
            <div
              key={user.id}
              className={`invite-user-found ${user.isAlreadyMember ? 'already-member' : ''}`}
            >
              <div className="invite-user-info">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="invite-user-avatar" />
                ) : (
                  <div className="invite-user-avatar-placeholder">{user.name?.charAt(0)}</div>
                )}
                <div>
                  <div className="invite-user-name">{user.name}</div>
                  {user.username && <div className="invite-user-username">@{user.username}</div>}
                </div>
              </div>
              {user.isAlreadyMember ? (
                <span className="already-member-badge">Member</span>
              ) : (
                <button
                  className="invite-add-btn"
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'groups', selectedGroupId), {
                        memberIds: arrayUnion(user.id)
                      });
                      setInviteUsername('');
                    } catch (error) {
                      console.error('Error inviting user:', error);
                    }
                  }}
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        {groupError && <div className="form-error">{groupError}</div>}
      </div>
    </div>
  );
}

export function ManageMembersModal() {
  const {
    showManageMembersModal, setShowManageMembersModal,
    selectedGroupId, getSelectedGroup, isGroupAdmin,
    users, currentUser,
    handleRemoveAdmin, handleTransferAdmin, handleRemoveMember,
  } = useApp();

  if (!showManageMembersModal || !selectedGroupId || !isGroupAdmin(selectedGroupId)) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowManageMembersModal(false)}>
      <div className="modal manage-members-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowManageMembersModal(false)}>✕</button>

        <h2>Manage Members</h2>
        <p>{getSelectedGroup()?.name}</p>

        <div className="members-list">
          {getSelectedGroup()?.memberIds?.map(memberId => {
            const member = users[memberId];
            if (!member) return null;

            const isAdmin = getSelectedGroup()?.adminIds?.includes(memberId);
            const isCurrentUser = memberId === currentUser?.uid;

            return (
              <div key={memberId} className="member-row">
                <div className="member-info">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="member-avatar" />
                  ) : (
                    <div className="member-avatar-placeholder">{member.name?.charAt(0)}</div>
                  )}
                  <div className="member-details">
                    <div className="member-name">
                      {member.name}
                      {isCurrentUser && <span className="member-you">(you)</span>}
                    </div>
                    {member.username && <div className="member-username">@{member.username}</div>}
                  </div>
                </div>
                <div className="member-actions">
                  {isAdmin ? (
                    <>
                      <span className="admin-badge">Admin</span>
                      {!isCurrentUser && getSelectedGroup()?.adminIds?.length > 1 && (
                        <button
                          className="member-action-btn"
                          onClick={() => {
                            if (window.confirm(`Remove admin role from ${member.name}?`)) {
                              handleRemoveAdmin(selectedGroupId, memberId);
                            }
                          }}
                          title="Remove admin role"
                        >
                          Remove Admin
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="member-action-btn promote"
                        onClick={() => {
                          if (window.confirm(`Make ${member.name} an admin?`)) {
                            handleTransferAdmin(selectedGroupId, memberId);
                          }
                        }}
                        title="Make admin"
                      >
                        Make Admin
                      </button>
                      <button
                        className="member-action-btn remove"
                        onClick={() => {
                          if (window.confirm(`Remove ${member.name} from the group?`)) {
                            handleRemoveMember(selectedGroupId, memberId);
                          }
                        }}
                        title="Remove from group"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="modal-close-btn" onClick={() => setShowManageMembersModal(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateChallengeModal() {
  const {
    showCreateChallengeModal, setShowCreateChallengeModal,
    selectedGroupId, getSelectedGroup,
    newChallengeName, setNewChallengeName,
    newChallengeType, setNewChallengeType,
    newChallengeTarget, setNewChallengeTarget,
    newChallengeStartDate, setNewChallengeStartDate,
    newChallengeEndDate, setNewChallengeEndDate,
    handleCreateChallenge, isCreatingChallenge,
    groupError,
  } = useApp();

  if (!showCreateChallengeModal || !selectedGroupId) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowCreateChallengeModal(false)}>
      <div className="modal challenge-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowCreateChallengeModal(false)}>✕</button>

        <h2>Create Challenge</h2>
        <p>Set a challenge for {getSelectedGroup()?.name}</p>

        <div className="form-group">
          <label>Challenge Name</label>
          <input
            type="text"
            placeholder="e.g., January Distance Challenge"
            value={newChallengeName}
            onChange={(e) => setNewChallengeName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label>Challenge Type</label>
          <div className="challenge-type-options">
            <button
              className={`challenge-type-btn ${newChallengeType === 'collective' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('collective')}
            >
              <span><Icon name="ui_target" size={20} /></span>
              <span>Collective Goal</span>
              <small>Team reaches target meters</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'distance_race' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('distance_race')}
            >
              <span><Icon name="ui_streak" size={20} /></span>
              <span>Distance Race</span>
              <small>Most meters wins</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'total_time' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('total_time')}
            >
              <span><Icon name="ui_timer" size={20} /></span>
              <span>Total Time</span>
              <small>Most time rowed wins</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'calories' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('calories')}
            >
              <span><Icon name="ui_fire" size={20} /></span>
              <span>Calorie Burn</span>
              <small>Most calories wins</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'collective_calories' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('collective_calories')}
            >
              <span><Icon name="ui_bolt" size={20} /></span>
              <span>Team Calories</span>
              <small>Team burns target cals</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'time_trial' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('time_trial')}
            >
              <span><Icon name="ui_records" size={20} /></span>
              <span>Time Trial</span>
              <small>Fastest time for distance</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'streak' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('streak')}
            >
              <span><Icon name="ui_streak" size={20} /></span>
              <span>Streak Battle</span>
              <small>Longest streak wins</small>
            </button>
            <button
              className={`challenge-type-btn ${newChallengeType === 'sessions' ? 'active' : ''}`}
              onClick={() => setNewChallengeType('sessions')}
            >
              <span><Icon name="ui_calendar" size={20} /></span>
              <span>Session Count</span>
              <small>Most sessions wins</small>
            </button>
          </div>
        </div>

        {(newChallengeType === 'collective' || newChallengeType === 'time_trial') && (
          <div className="form-group">
            <label>
              {newChallengeType === 'collective' ? 'Target Meters' : 'Distance (meters)'}
            </label>
            <input
              type="number"
              placeholder={newChallengeType === 'collective' ? 'e.g., 100000' : 'e.g., 500'}
              value={newChallengeTarget}
              onChange={(e) => setNewChallengeTarget(e.target.value)}
            />
            {newChallengeType === 'collective' && newChallengeTarget && (
              <small className="form-hint">
                That's {formatMeters(parseInt(newChallengeTarget, 10))} for the team
              </small>
            )}
          </div>
        )}

        {newChallengeType === 'collective_calories' && (
          <div className="form-group">
            <label>Target Calories</label>
            <input
              type="number"
              placeholder="e.g., 50000"
              value={newChallengeTarget}
              onChange={(e) => setNewChallengeTarget(e.target.value)}
            />
            {newChallengeTarget && (
              <small className="form-hint">
                That's {parseInt(newChallengeTarget, 10).toLocaleString()} calories for the team
              </small>
            )}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={newChallengeStartDate}
              onChange={(e) => setNewChallengeStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={newChallengeEndDate}
              onChange={(e) => setNewChallengeEndDate(e.target.value)}
            />
          </div>
        </div>

        {groupError && <div className="form-error">{groupError}</div>}

        <button
          className="primary-btn"
          onClick={handleCreateChallenge}
          disabled={!newChallengeName.trim() || !newChallengeStartDate || !newChallengeEndDate || isCreatingChallenge}
        >
          {isCreatingChallenge ? 'Creating...' : 'Create Challenge'}
        </button>
      </div>
    </div>
  );
}
