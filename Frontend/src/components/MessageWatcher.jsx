import { useEffect } from 'react'
import useSimpleWebSocketStore from '../stores/simpleWebSocketStore';
import useGroupChatStore from '../stores/groupChatStore';
import { ToastContainer, toast } from 'react-toastify';

const MessageWatcher = () => {

    const { removeFirstMessage } = useSimpleWebSocketStore();
    const { addGroupChat, currentUser, } = useGroupChatStore();

    useEffect(() => {
        const unsubscribe = useSimpleWebSocketStore.subscribe(
            (state) => state.messages,
            (messages) => {
                if (messages.length > 0) {
                    const messageToProcess = messages[0];
                    if (messageToProcess?.message?.sentBy === currentUser?.username) {
                        if (messageToProcess?.action == "messageModerated") {
                            toast.warn("Your message has been moderated and will not be displayed to  other users! \n Please be kind🌿.", {
                                position: "top-center"
                            });
                        }
                        else if (messageToProcess?.action == "newMessage" && messageToProcess?.message?.message === "Image removed for violation of community guidelines.") {
                            toast.warn("Your Image upload has been moderated and will not be displayed to  other users! \n Please be kind🌿.", {
                                position: "top-center"
                            });
                        }
                    }
                    else {
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