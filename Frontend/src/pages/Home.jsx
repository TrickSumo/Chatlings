import { useEffect, useState } from 'react'
import styles from './Home.module.css'
import Groups from '../components/Groups';
import ChatMessages from '../components/ChatMessages';
import CreateGroupModal from '../components/CreateGroupModal';
import MessageInput from '../components/MessageInput';
import useSimpleWebSocket from '../hooks/useSimpleWebSocket';
import useGroupChatStore from '../stores/groupChatStore';
import { webSocketActions } from '../utils/constants';
import MessageWatcher from '../components/MessageWatcher';

const Home = () => {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  const { isConnected, sendMessageWithAck } = useSimpleWebSocket();
  const { groups, setGroups, addGroup, selectedGroup,
    setSelectedGroup, groupChats, setGroupChats, addGroupChat,
    currentUser, initializeUser } = useGroupChatStore();

  const handleNewGroupClick = () => {
    setShowCreateGroupModal(true)
  }

  // Initialize current user when component mounts
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const handleSendMessage = async (message) => {
    try {
      const res = await sendMessageWithAck(webSocketActions.SEND_MESSAGE_TO_GROUP, { message, groupName: selectedGroup.split("GROUP#")[1] });
      if (res.statusCode === 200) {
        addGroupChat(selectedGroup, res.message);
      }
    }
    catch (err) {
      console.error('Error sending message:', err);
    }
  }


  if (!isConnected) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader} />
      </div>
    )
  }

  return (
    <div className={styles.app}>

      {/* New Group Button */}
      <div className={styles.newChatContainer}>
        <button className={styles.newChatBtn} onClick={handleNewGroupClick}>
          New Group
        </button>
      </div>

      {/* Groups Section */}
      <Groups
        groups={groups}
        setGroups={setGroups}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        sendMessageWithAck={sendMessageWithAck} />

      {/* Chat Messages */}
      {selectedGroup &&
        <ChatMessages
          selectedGroup={selectedGroup}
          groupChats={groupChats}
          setGroupChats={setGroupChats}
          currentUser={currentUser}
          sendMessageWithAck={sendMessageWithAck}
        />}

      {/* Message Input */}
      {selectedGroup && (
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
          sendMessageWithAck={sendMessageWithAck}
          addGroupChat={addGroupChat}
          currentUser={currentUser}
          selectedGroup={selectedGroup}
        />
      )}

      {/* Create Chat Modal */}
      {showCreateGroupModal && <CreateGroupModal
        setShowCreateGroupModal={setShowCreateGroupModal}
        sendMessageWithAck={sendMessageWithAck}
        addGroup={addGroup}
      />}

      {/* Keep Track Of New Messages */}
      <MessageWatcher />
    </div>
  )
};

export default Home;
