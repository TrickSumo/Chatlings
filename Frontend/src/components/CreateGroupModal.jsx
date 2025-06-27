import React, { useState } from 'react'
import styles from '../pages/Home.module.css'
import useGroupChatStore from '../stores/groupChatStore'

const CreateGroupModal = ({ setShowCreateGroupModal }) => {

    const [selectedEmoji, setSelectedEmoji] = useState('🎯');
    const [groupName, setGroupName] = useState('')
    const [groupCode, setGroupCode] = useState('')

    const { emojiOptions } = useGroupChatStore();

    const handleCloseModal = () => {
        setShowCreateGroupModal(false)
        setGroupName('')
        setGroupCode('')
        setSelectedEmoji('🎯')
    }

    const handleCreateGroup = () => {
        if (groupName.trim() && groupCode.trim()) {
            console.log('Creating chat:', { groupName, groupCode, emoji: selectedEmoji })
            handleCloseModal()
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create New Chat</h2>
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