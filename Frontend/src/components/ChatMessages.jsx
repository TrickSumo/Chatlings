import React from 'react'
import styles from '../pages/Home.module.css'
import useGroupChatStore from '../stores/groupChatStore'

const ChatMessages = () => {
    const { selectedGroup, groupChats, emojiOptions } = useGroupChatStore();
    const currentChats = groupChats[selectedGroup] || groupChats[Object.keys(groupChats)[0]] || []
    return (
        <div className={styles.chatContainer}>
            {currentChats.map((chat) => (
                <div key={chat.id} className={styles.messageGroup}>
                    {chat.isUser ? (
                        <div className={styles.currentUserMessage}>
                            <div className={styles.messageBubble}>
                                {chat.message}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.userMessage}>
                            <div className={styles.avatar}>{chat.avatar}</div>
                            <div className={styles.messageContent}>
                                <div className={styles.userName}>{chat.user}</div>
                                <div className={styles.messageBubble}>
                                    {chat.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default ChatMessages