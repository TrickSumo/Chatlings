import { useState, useEffect } from 'react'
import styles from './Groups.module.css'
import { webSocketActions } from '../utils/constants';

const Groups = ({groups, setGroups, selectedGroup, setSelectedGroup, sendMessageWithAck}) => {
    const [showAllGroups, setShowAllGroups] = useState(false)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchGroups = async () => {
            try {
                const res = await sendMessageWithAck(webSocketActions.LIST_GROUPS_FOR_USER);
                console.log('Fetched groups:', res);
                setGroups(res.groups || []);
                setSelectedGroup(res.groups?.[0]?.PK || res.groups?.[0]?.groupId || null); // Set first group as selected by default
            
            
            console.log('Selected Group:', selectedGroup)}
            catch (error) {
                console.error('Error fetching groups:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchGroups()
    }, [])

    // Create a reordered groups array with selected group at top
    const getOrderedGroups = () => {
        if (!groups || groups.length === 0) return [];
        if (selectedGroup === null || selectedGroup === undefined) return groups; // If no group is selected, show original order
        const selectedGroupObj = groups.find(group => (group.PK || group.groupId) === selectedGroup);
        const otherGroups = groups.filter(group => (group.PK || group.groupId) !== selectedGroup);
        return selectedGroupObj ? [selectedGroupObj, ...otherGroups] : groups;
    }

    const orderedGroups = getOrderedGroups();
    const displayedGroups = showAllGroups ? orderedGroups : orderedGroups.slice(0, 1)

    const toggleShowAllGroups = () => {
        setShowAllGroups(!showAllGroups)
    }

    const handleGroupSelect = (groupId) => {
        setSelectedGroup(groupId)
        // If a group is selected while in expanded mode, collapse the list
        if (showAllGroups) {
            setShowAllGroups(false)
        }
    }

    if (loading || !groups) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader} />
            </div>
        )
    }

    if (groups.length === 0) return <></>

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
                        key={group.PK || group.groupId}
                        className={`${styles.groupItem} ${selectedGroup === (group.PK || group.groupId) ? styles.selectedGroupItem : ''}`}
                        onClick={() => handleGroupSelect(group.PK || group.groupId)} // PK is primary key. ie. group ID
                    >
                        <div className={styles.groupIcon}>{group.groupIcon || "🐥"}</div>
                        <span className={styles.groupName}>{group.groupName}</span>
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