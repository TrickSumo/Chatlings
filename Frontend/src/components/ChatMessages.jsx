import { useEffect } from 'react'
import styles from '../pages/Home.module.css'
import { webSocketActions } from '../utils/constants';
import useGroupChatStore from '../stores/groupChatStore';

const ChatMessages = ({ selectedGroup, groupChats, setGroupChats, currentUser, sendMessageWithAck }) => {
    const currentChats = groupChats?.[selectedGroup]
    const { groupChatPaginationKeys, setGroupChatPaginationKey, prependGroupChats } = useGroupChatStore();
    const paginationKey = groupChatPaginationKeys?.[selectedGroup];

    useEffect(() => {
        const fetchChats = async (groupId) => {
            try {
                const res = await sendMessageWithAck(webSocketActions.FETCH_GROUP_CHAT_HISTORY, { groupName: groupId.split("GROUP#")[1] });
                setGroupChats(groupId, res.messages || []);
                setGroupChatPaginationKey(groupId, res.lastEvaluatedKey || null);
            }
            catch (error) {
                console.error('Error fetching groups:', error);
            }
        }
        fetchChats(selectedGroup);
    }, [selectedGroup])

    const loadOlder = async () => {
        try {
            const res = await sendMessageWithAck(webSocketActions.FETCH_GROUP_CHAT_HISTORY, {
                groupName: selectedGroup.split("GROUP#")[1],
                lastEvaluatedKey: paginationKey,
            });
            prependGroupChats(selectedGroup, res.messages || []);
            setGroupChatPaginationKey(selectedGroup, res.lastEvaluatedKey || null);
        }
        catch (error) {
            console.error('Error loading older messages:', error);
        }
    }

    if (!currentChats) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.noMessages}>Loading!!!</div>
            </div>
        )
    }

    if (currentChats.length === 0) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.noMessages}>No messages yet. Start chatting!</div>
            </div>
        )
    }

    return (
        <div className={styles.chatContainer}>
            {paginationKey && (
                <button className={styles.loadOlderBtn} onClick={loadOlder}>
                    Load older messages
                </button>
            )}
            {currentChats?.map((chat) => (
                <div key={chat.SK} className={styles.messageGroup}>
                    {chat.sentBy === currentUser.username ? (
                        <div className={styles.currentUserMessage}>
                            <div className={styles.messageBubble}>
                                {chat.type === "txt" || chat.type === "text" ? chat.message : <img src={`/${chat.message}`} className={styles.messageImage} />}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.userMessage}>
                            <div className={styles.avatar}>{chat.sentBy === "askbot" ? "🤖" : chat.avatar || "🌸"}</div>
                            <div className={styles.messageContent}>
                                <div className={styles.userName}>{chat.sentBy}</div>
                                <div className={styles.messageBubble}>
                                    {chat.type === "txt" || chat.type === "text" ? chat.message : <img src={`/${chat.message}`} className={styles.messageImage} />}
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