import { create } from "zustand";
import { getUserDetails } from '../utils/utils';


const useGroupChatStore = create((set) => ({

    groups: null,
    selectedGroup: null,
    groupChats: {},
    currentUser: getUserDetails(),
    // {
    //     0: [ // Space Explorers
    //         { id: 1, user: 'Emma', avatar: '👧', message: 'Who wants to learn about Mars? 🚀', isUser: false },
    //         { id: 2, message: 'I do!', isUser: true },
    //         { id: 3, user: 'Alex', avatar: '👦', message: 'Cool! Did you know Mars has two moons?', isUser: false }
    //     ],
    //     1: [ // Art Club
    //         { id: 1, user: 'Sophia', avatar: '👧', message: 'Check out my new painting! 🎨', isUser: false },
    //         { id: 2, message: 'Amazing colors!', isUser: true },
    //         { id: 3, user: 'Maya', avatar: '👧🏽', message: 'Love the creativity!', isUser: false }
    //     ],
    //     2: [ // Game Buddies
    //         { id: 1, user: 'Ella', avatar: '👧', message: 'Hi everyone! 😊', isUser: false },
    //         { id: 2, message: 'Hello!', isUser: true },
    //         { id: 3, message: 'Hello! How are you?', isUser: true },
    //         { id: 4, user: 'Jake', avatar: '👦', message: 'Does anyone want to play?', isUser: false },
    //         { id: 5, user: 'Ava', avatar: '👧🏽', message: 'Sure! Let\'s start a game.', isUser: false },
    //         { id: 6, message: 'This is a really really really really really really really really really really really really really really really really really really really really really really really long message to test how the chat handles overflow and word wrapping in the UI', isUser: true },
    //         { id: 7, user: 'TestUser', avatar: '🧪', message: 'This is another super long message from another user that should also wrap properly without breaking the chat layout or causing horizontal scrolling issues in the interface', isUser: false }
    //     ],
    //     3: [ // Study Group
    //         { id: 1, user: 'Ben', avatar: '👦', message: 'Anyone need help with math homework?', isUser: false },
    //         { id: 2, message: 'Yes please!', isUser: true },
    //         { id: 3, user: 'Lisa', avatar: '👧', message: 'I can help with science too!', isUser: false }
    //     ],
    //     4: [ // Sports Team
    //         { id: 1, user: 'Tom', avatar: '👦', message: 'Practice is at 3pm today! ⚽', isUser: false },
    //         { id: 2, message: 'I\'ll be there!', isUser: true },
    //         { id: 3, user: 'Sam', avatar: '👧', message: 'Can\'t wait!', isUser: false }
    //     ],
    //     5: [ // Music Club
    //         { id: 1, user: 'Aria', avatar: '👧', message: 'New song practice today! 🎵', isUser: false },
    //         { id: 2, message: 'What song?', isUser: true },
    //         { id: 3, user: 'Leo', avatar: '👦', message: 'Something upbeat!', isUser: false }
    //     ]
    // },
    emojiOptions: [
        '🌿', '🚀', '🎨', '⚽', '🎵',
        '🌟', '🔥', '💡',  '🎬', '📱',
        '🏆', '🎊', '🎈', '🎁', '🍎', '🐱', '🦄',
        '🌈', '⭐', '❤️', '😊', '🤖', '👑', '🎳', '🎸'
    ],

    setSelectedGroup: (groupId) => set((state) => ({
        selectedGroup: groupId
    })),
    setGroups: (newGroups) => set(() => ({
        groups: newGroups
    }
    )),
    addGroup: (newGroup) => set((state) => ({
        groups: [...(state.groups || []), newGroup]
    })),
    setGroupChats: (groupId, newChats) => set((state) => ({
        groupChats: {
            ...state.groupChats,
            [groupId]: newChats
        }
    })),
    addGroupChat: (groupId, newChat) => set((state) => ({
        groupChats: {
            ...state.groupChats,
            [groupId]: [...(state.groupChats[groupId] || []), newChat]
        }
    })),
}));

export default useGroupChatStore;