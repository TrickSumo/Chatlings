import { useState } from 'react'
import styles from './MessageInput.module.css'
import { generateUniqueKey } from '../utils/utils'
import { webSocketActions } from '../utils/constants'
import { ToastContainer, toast } from 'react-toastify';

const MessageInput = ({
    onSendMessage, sendMessageWithAck, addGroupChat,
    selectedGroup, currentUser, disabled = false
}) => {
    const [message, setMessage] = useState('')

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message.trim())
            setMessage('')
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleAttachment = async () => {
        console.log('Attachment upload initiated')
        // Create a file input element to trigger file selection
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.multiple = false
        fileInput.accept = '.png,image/png'
        fileInput.onchange = async (e) => {
            const file = e.target.files[0] // Get the single selected file
            if (file) {
                console.log('File selected:', file)
                try {

                    const uniqueFileName = generateUniqueKey(file)
                    console.log('Unique file name generated:', uniqueFileName);

                    const presignedRes = await sendMessageWithAck(webSocketActions.GENERATE_S3_PRE_SIGNED_URL, {
                        fileName: uniqueFileName,
                        groupName: selectedGroup.split("GROUP#")[1]
                    })

                    if (presignedRes.statusCode === 200) {
                        console.log('Presigned URL response:', presignedRes.url);

                        // Upload file to S3 using presigned URL
                        try {
                            console.log('Uploading file to S3...');
                            toast.info("☑️Uploading file...", {autoClose: 1500});
                            const uploadResponse = await fetch(presignedRes.url, {
                                method: 'PUT',
                                body: file,
                                headers: {
                                    'Content-Type': 'image/png'
                                }
                            });

                            if (uploadResponse.ok) {
                                console.log('File uploaded successfully to S3');
                                toast.success("✅Uploaded file...", {autoClose: 1500});
                                addGroupChat(selectedGroup,
                                    {
                                        "SK": "MESSAGE#" + new Date().toISOString(),
                                        "message": uniqueFileName,
                                        "type": "img",
                                        "PK": selectedGroup,
                                        "sentBy": currentUser.username
                                    },
                                )
                            } else {
                                console.error('Failed to upload file to S3:', uploadResponse.status, uploadResponse.statusText);
                            }
                        } catch (uploadError) {
                            console.error('Error uploading file to S3:', uploadError);
                        }
                    } else {
                        console.error('Failed to get presigned URL:', presignedRes);
                    }
                } catch (error) {
                    console.error('Error getting presigned URL:', error);
                    alert('Failed to upload file. Please try again later.')
                }
            }
        }
        fileInput.click()
    }

    return (
        <div className={styles.messageInput}>
            <button
                className={styles.attachmentButton}
                onClick={handleAttachment}
                disabled={disabled}
                title="Upload attachments"
            >
                <span className={styles.attachmentIcon}>📎</span>
            </button>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className={styles.textInput}
                disabled={disabled}
            />
            <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={disabled || !message.trim()}
            >
                <span className={styles.sendIcon}>🚀</span>
            </button>
            <ToastContainer />
        </div>
    )
}

export default MessageInput
