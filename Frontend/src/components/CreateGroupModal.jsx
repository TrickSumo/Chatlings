import React, { useState } from 'react'
import styles from './CreateGroupModal.module.css'
import useGroupChatStore from '../stores/groupChatStore'
import { useNavigate } from "react-router";
import { webSocketActions } from '../utils/constants';

const CreateGroupModal = ({ setShowCreateGroupModal, sendMessageWithAck, addGroup }) => {

    const [selectedEmoji, setSelectedEmoji] = useState('🌿');
    const [groupName, setGroupName] = useState('')
    const [groupCode, setGroupCode] = useState('')

    const { emojiOptions } = useGroupChatStore();

    const handleCloseModal = () => {
        setShowCreateGroupModal(false)
        setGroupName('')
        setGroupCode('')
        setSelectedEmoji('🎯')
    }

    const handleJoinGroup = async () => {
        if (groupName.trim() && groupCode.trim()) {
            console.log('Joining Group:', { groupName, groupCode, groupIcon: selectedEmoji })
            try {
                const res = await sendMessageWithAck(webSocketActions.JOIN_GROUP, { groupName, groupCode, groupIcon: selectedEmoji })
                addGroup(res.message)
                alert(`Joined group ${groupName} successfully!`)

            }
            catch (err) {
                console.error('Error joining group:', err);
                alert(`Failed to join group: ${err.message || 'Unknown error'}`);

            }
            finally {
                handleCloseModal();
            }
        }
    }

    const handleCreateGroup = async () => {
        if (groupName.trim()) {
            console.log('Creating Group:', { groupName, groupCode, emoji: selectedEmoji })
            try {
                const res = await sendMessageWithAck(webSocketActions.CREATE_GROUP, { groupName, groupCode, groupIcon: selectedEmoji })
                addGroup(res.message)
                alert(`Group ${groupName} created successfully!`)
                handleCloseModal()
            }

            catch (err) {
                console.error('Error creating group:', err);
                alert(`Failed to create group: ${err.message || 'Unknown error'}`);
            }
            finally {
                handleCloseModal();
            }
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create or Join New Group!</h2>
                    <button className={styles.closeButton} onClick={handleCloseModal}>
                        ✕
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Choose Icon</label>
                        <div className={styles.emojiSelector}>
                            <div className={styles.selectedEmoji}>
                                {selectedEmoji}
                            </div>
                            <div className={styles.emojiGrid}>
                                {emojiOptions.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className={`${styles.emojiOption} ${selectedEmoji === emoji ? styles.selectedEmojiOption : ''}`}
                                        onClick={() => setSelectedEmoji(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className={styles.modalInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Group Code</label>
                        <input
                            type="text"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            placeholder="Enter group code..."
                            className={styles.modalInput}
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={handleCloseModal}>
                        Cancel
                    </button>
                    <button
                        className={styles.createButton}
                        onClick={handleJoinGroup}
                        disabled={!groupName.trim() || !groupCode.trim()}
                    >
                        Join
                    </button>
                    <button
                        className={styles.createButton}
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || !groupCode.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    )

}

export default CreateGroupModal