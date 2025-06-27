import { useState } from 'react'
import styles from './Home.module.css'

// Import assets
import logo from '../assets/logonew.png'
import Groups from '../components/Groups';


import ChatMessages from '../components/ChatMessages';
import CreateGroupModal from '../components/CreateGroupModal';

const Home = () => {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  const handleNewGroupClick = () => {
    setShowCreateGroupModal(true)
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
      <Groups/>
    
      {/* Chat Messages */}
      <ChatMessages/>

      {/* Message Input */}
      <div className={styles.messageInput}>
        <button className={styles.videoCallButton}>
          <span className={styles.videoIcon}>🎦</span>
        </button>
        <input 
          type="text" 
          placeholder="Type a message..."
          className={styles.textInput}
        />
        <button className={styles.sendButton}>
          <span className={styles.sendIcon}>🚀</span>
        </button>
      </div>

      {/* Create Chat Modal */}
      {showCreateGroupModal && <CreateGroupModal setShowCreateGroupModal={setShowCreateGroupModal}/>}
    </div>
  )
};

export default Home;
