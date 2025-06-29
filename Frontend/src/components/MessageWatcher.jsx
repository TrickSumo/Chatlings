import React, { useEffect } from 'react'
import useSimpleWebSocketStore from '../stores/simpleWebSocketStore';
import useGroupChatStore from '../stores/groupChatStore';

const MessageWatcher = () => {

    const { removeFirstMessage } = useSimpleWebSocketStore();
    const { addGroupChat, currentUser, } = useGroupChatStore();

    useEffect(() => {
        const unsubscribe = useSimpleWebSocketStore.subscribe(
            (state) => state.messages,
            (messages) => {
                if (messages.length > 0) {
                    const messageToProcess = messages[0];
                    if (messageToProcess?.action == "messageModerated" && messageToProcess?.message?.sentBy === currentUser?.username) {
                        alert("Your message has been moderated and will not be displayed to  other users! \n Please be kind🌿.");
                    }
                    else if (messageToProcess?.action == "newMessage" && messageToProcess?.message?.sentBy === currentUser?.username && messageToProcess?.message?.message === "Image removed for violation of community guidelines.") {
                        alert("Your Image upload has been moderated and will not be displayed to  other users! \n Please be kind🌿.");
                    }
                    else if (messageToProcess?.message?.sentBy !== currentUser?.username) {
                        // alert(`Message from ${messageToProcess?.message?.sentBy} has been moderated and will not be displayed to you! \n Please be kind🌿.`);                      
                        addGroupChat(messageToProcess?.message?.PK, messageToProcess?.message)
                    }
                    removeFirstMessage(); // Remove the first message to simulate FIFO queue behavior                 
                }
            }
        );

        // Cleanup function
        return () => unsubscribe()
    }, []);

    return <></>
}

export default MessageWatcher