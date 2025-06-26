import { useState } from 'react'
import styles from './Home.module.css'

// Import assets
import logo from '../assets/logo.png'

const Home = () => {
  const [showCreateChatModal, setShowCreateChatModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎯')
  const [selectedGroup, setSelectedGroup] = useState(0) // Index of selected group
  const [showAllGroups, setShowAllGroups] = useState(false)

  const groups = [
    { id: 0, icon: '🚀', name: 'Space Explorers' },
    { id: 1, icon: '🎨', name: 'Art Club' },
    { id: 2, icon: '🎮', name: 'Game Buddies' },
    { id: 3, icon: '📚', name: 'Study Group' },
    { id: 4, icon: '⚽', name: 'Sports Team' },
    { id: 5, icon: '🎵', name: 'Music Club' }
  ]

  const groupChats = {
    0: [ // Space Explorers
      { id: 1, user: 'Emma', avatar: '👧', message: 'Who wants to learn about Mars? 🚀', isUser: false },
      { id: 2, message: 'I do!', isUser: true },
      { id: 3, user: 'Alex', avatar: '👦', message: 'Cool! Did you know Mars has two moons?', isUser: false }
    ],
    1: [ // Art Club
      { id: 1, user: 'Sophia', avatar: '👧', message: 'Check out my new painting! 🎨', isUser: false },
      { id: 2, message: 'Amazing colors!', isUser: true },
      { id: 3, user: 'Maya', avatar: '👧🏽', message: 'Love the creativity!', isUser: false }
    ],
    2: [ // Game Buddies
      { id: 1, user: 'Ella', avatar: '👧', message: 'Hi everyone! 😊', isUser: false },
      { id: 2, message: 'Hello!', isUser: true },
      { id: 3, message: 'Hello! How are you?', isUser: true },
      { id: 4, user: 'Jake', avatar: '👦', message: 'Does anyone want to play?', isUser: false },
      { id: 5, user: 'Ava', avatar: '👧🏽', message: 'Sure! Let\'s start a game.', isUser: false },
      { id: 6, message: 'This is a really really really really really really really really really really really really really really really really really really really really really really really long message to test how the chat handles overflow and word wrapping in the UI', isUser: true },
      { id: 7, user: 'TestUser', avatar: '🧪', message: 'This is another super long message from another user that should also wrap properly without breaking the chat layout or causing horizontal scrolling issues in the interface', isUser: false }
    ],
    3: [ // Study Group
      { id: 1, user: 'Ben', avatar: '👦', message: 'Anyone need help with math homework?', isUser: false },
      { id: 2, message: 'Yes please!', isUser: true },
      { id: 3, user: 'Lisa', avatar: '👧', message: 'I can help with science too!', isUser: false }
    ],
    4: [ // Sports Team
      { id: 1, user: 'Tom', avatar: '👦', message: 'Practice is at 3pm today! ⚽', isUser: false },
      { id: 2, message: 'I\'ll be there!', isUser: true },
      { id: 3, user: 'Sam', avatar: '👧', message: 'Can\'t wait!', isUser: false }
    ],
    5: [ // Music Club
      { id: 1, user: 'Aria', avatar: '👧', message: 'New song practice today! 🎵', isUser: false },
      { id: 2, message: 'What song?', isUser: true },
      { id: 3, user: 'Leo', avatar: '👦', message: 'Something upbeat!', isUser: false }
    ]
  }

  const emojiOptions = [
    '🎯', '🚀', '🎨', '🎮', '📚', '⚽', '🎵', '🍕', 
    '🌟', '🔥', '💡', '🎪', '🎭', '🎬', '📱', '🎲',
    '🏆', '🎊', '🎈', '🎁', '🍎', '🐱', '🐶', '🦄',
    '🌈', '⭐', '❤️', '😊', '🤖', '👑', '🎳', '🎸'
  ]

  // Create a reordered groups array with selected group at top
  const getOrderedGroups = () => {
    if (selectedGroup === 0) return groups; // If first group is selected, no need to reorder
    
    const selectedGroupObj = groups.find(g => g.id === selectedGroup);
    const otherGroups = groups.filter(g => g.id !== selectedGroup);
    
    return selectedGroupObj ? [selectedGroupObj, ...otherGroups] : groups;
  }

  const orderedGroups = getOrderedGroups();
  const displayedGroups = showAllGroups ? orderedGroups : orderedGroups.slice(0, 1)
  const currentChats = groupChats[selectedGroup] || []

  const handleNewChatClick = () => {
    setShowCreateChatModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateChatModal(false)
    setGroupName('')
    setGroupCode('')
    setSelectedEmoji('🎯')
  }

  const handleCreateChat = () => {
    if (groupName.trim() && groupCode.trim()) {
      // Handle chat creation logic here
      console.log('Creating chat:', { groupName, groupCode, emoji: selectedEmoji })
      handleCloseModal()
    }
  }

  const handleGroupSelect = (groupIndex) => {
    setSelectedGroup(groupIndex)
    // If a group is selected while in expanded mode, collapse the list
    if (showAllGroups) {
      setShowAllGroups(false)
    }
  }

  const toggleShowAllGroups = () => {
    setShowAllGroups(!showAllGroups)
  }
  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Chatlings Logo" className={styles.logo} />
        </div>
      </header>

      {/* New Chat Button */}
      <div className={styles.newChatContainer}>
        <button className={styles.newChatBtn} onClick={handleNewChatClick}>
          New Chat
        </button>
      </div>

      {/* Groups Section */}
      <div className={styles.groupsSection}>
        <div className={styles.groupsHeader}>
          <h2 className={styles.groupsTitle}>Groups</h2>
          <button 
            className={styles.expandButton} 
            onClick={toggleShowAllGroups}
          >
            {showAllGroups ? '🔼' : '🔽'}
          </button>
        </div>
        
        <div className={styles.groupsList}>
          {displayedGroups.map((group) => (
            <div 
              key={group.id} 
              className={`${styles.groupItem} ${selectedGroup === group.id ? styles.selectedGroupItem : ''}`}
              onClick={() => handleGroupSelect(group.id)}
            >
              <div className={styles.groupIcon}>{group.icon}</div>
              <span className={styles.groupName}>{group.name}</span>
              <span className={styles.chevron}>›</span>
            </div>
          ))}
          
          {!showAllGroups && orderedGroups.length > 1 && (
            <div className={styles.showMoreButton} onClick={toggleShowAllGroups}>
              <span className={styles.showMoreText}>
                Show {orderedGroups.length - 1} more groups...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
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

      {/* Message Input */}
      <div className={styles.messageInput}>
        <button className={styles.videoCallButton}>
          <span className={styles.videoIcon}>📹</span>
        </button>
        <input 
          type="text" 
          placeholder="Type a message..."
          className={styles.textInput}
        />
        <button className={styles.sendButton}>
          <span className={styles.sendIcon}>✈️</span>
        </button>
      </div>

      {/* Create Chat Modal */}
      {showCreateChatModal && (
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
                onClick={handleCreateChat}
                disabled={!groupName.trim() || !groupCode.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default Home;
