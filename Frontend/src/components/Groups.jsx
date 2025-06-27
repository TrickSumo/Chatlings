import React, { useState } from 'react'
import styles from './Groups.module.css'
import useGroupChatStore from '../stores/groupChatStore'

const Groups = () => {
    const [showAllGroups, setShowAllGroups] = useState(false)

    const { groups, groupChats, emojiOptions, selectedGroup, setSelectedGroup } = useGroupChatStore();

    // Create a reordered groups array with selected group at top
    const getOrderedGroups = () => {
        if (selectedGroup === 0) return groups; // If first group is selected, no need to reorder
        const selectedGroupObj = groups.find(g => g.id === selectedGroup);
        const otherGroups = groups.filter(g => g.id !== selectedGroup);
        return selectedGroupObj ? [selectedGroupObj, ...otherGroups] : groups;
    }

    const orderedGroups = getOrderedGroups();
    const displayedGroups = showAllGroups ? orderedGroups : orderedGroups.slice(0, 1)

    const toggleShowAllGroups = () => {
        setShowAllGroups(!showAllGroups)
    }

    const handleGroupSelect = (groupIndex) => {
        setSelectedGroup(groupIndex)
        // If a group is selected while in expanded mode, collapse the list
        if (showAllGroups) {
            setShowAllGroups(false)
        }
    }

    if(groups.length === 0) return <></>

    return (
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
    )
}

export default Groups