import { create } from "zustand";
import { getUserDetails } from '../utils/utils';


const useGroupChatStore = create((set, get) => ({

    groups: null,
    selectedGroup: null,
    groupChats: {},
    currentUser: null,
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
    // Method to initialize user if not already set
    initializeUser: () => {
        const state = get();
        if (!state.currentUser) {
            const userDetails = getUserDetails();
            if (userDetails) {
                set({ currentUser: userDetails });
            }
        }
    },
}));

export default useGroupChatStore;