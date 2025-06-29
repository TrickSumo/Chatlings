import { useEffect } from 'react'
import styles from '../pages/Home.module.css'
import { webSocketActions } from '../utils/constants';

const ChatMessages = ({ selectedGroup, groupChats, setGroupChats, currentUser, sendMessageWithAck }) => {
    const currentChats = groupChats?.[selectedGroup]

    useEffect(() => {
        const fetchChats = async (groupId) => {
            try {
                const res = await sendMessageWithAck(webSocketActions.FETCH_GROUP_CHAT_HISTORY, { groupName: groupId.split("GROUP#")[1] });
                console.log('Fetched chats', res);
                setGroupChats(groupId, res.messages || []);
            }
            catch (error) {
                console.error('Error fetching groups:', error);
            }
        }
        // if (!currentChats) 
        fetchChats(selectedGroup);
    }, [selectedGroup])

    if (!currentChats || currentChats.length === 0) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.noMessages}>No messages yet. Start chatting!</div>
            </div>
        )
    }

    return (
        <div className={styles.chatContainer}>
            {currentChats?.map((chat) => (
                <div key={chat.SK} className={styles.messageGroup}>
                    {chat.sentBy === currentUser.username ? (
                        <div className={styles.currentUserMessage}>
                            <div className={styles.messageBubble}>
                                {chat.type ==="txt" || chat.type ==="text"?chat.message:<img src={`./${chat.message}`}/>}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.userMessage}>
                            <div className={styles.avatar}>{chat.avatar || "🌸"}</div>
                            <div className={styles.messageContent}>
                                <div className={styles.userName}>{chat.sentBy}</div>
                                <div className={styles.messageBubble}>
                                    {chat.type ==="txt" || chat.type ==="text"?chat.message:<img src={`./${chat.message}`}/>}
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