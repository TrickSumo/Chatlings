import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'
import logo from '../assets/logonew.png'
import heroDuck from '../assets/landingPageHeroDuck.png'
import teddyIcon from '../assets/teddyIcon.png'
import chatBotIcon from '../assets/chatBotIcon.png'
import imagesIcon from '../assets/imagesIcon.png'
import chatFriendsIcon from '../assets/chatFriendsIcon.png'

const LandingPage = () => {
    const navigate = useNavigate();
    const handleGetStarted = () => {
        navigate('/app');
    }
    return (
        <div className={styles.app}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoContainer}>
                    <img src={logo} alt="Chatlings Logo" className={styles.logo} />
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <h1 className={styles.heroTitle}>
                            Welcome to Chatlings
                        </h1>
                        <p className={styles.heroSubtitle}>
                            A safe, friendly place where kids chat, learn, and have fun!
                        </p>
                        <button className={styles.getStartedBtn} onClick={handleGetStarted}>
                            Get Started
                        </button>
                    </div>
                    <div className={styles.heroImage}>
                        <img
                            src={heroDuck}
                            alt="Chatlings Duck Character"
                            className={styles.duckCharacter}
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.featuresContainer}>
                    <h2 className={styles.featuresTitle}>Why Chatlings?</h2>

                    <div className={styles.featuresGrid}>
                        <div className={styles.featureItem}>
                            <img
                                src={teddyIcon}
                                alt="Safe Chat"
                                className={styles.featureIcon}
                            />
                            <h3 className={styles.featureTitle}>Safe & Friendly Chat</h3>
                            <p className={styles.featureDescription}>
                                A secure environment where kids can chat safely with moderated conversations
                            </p>
                        </div>

                        <div className={styles.featureItem}>
                            <img
                                src={chatBotIcon}
                                alt="Share Content"
                                className={styles.featureIcon}
                            />
                            <h3 className={styles.featureTitle}>Share Art, Photos & Stickers</h3>
                            <p className={styles.featureDescription}>
                                Express creativity by sharing artwork, photos, and fun stickers with friends
                            </p>
                        </div>

                        <div className={styles.featureItem}>
                            <img
                                src={imagesIcon}
                                alt="Smart Helper"
                                className={styles.featureIcon}
                            />
                            <h3 className={styles.featureTitle}>Smart Message Helper</h3>
                            <p className={styles.featureDescription}>
                                AI-powered assistance to help kids communicate better and learn while chatting
                            </p>
                        </div>

                        <div className={styles.featureItem}>
                            <img
                                src={chatFriendsIcon}
                                alt="Study Buddies"
                                className={styles.featureIcon}
                            />
                            <h3 className={styles.featureTitle}>Make StudyBuddies in Your Class</h3>
                            <p className={styles.featureDescription}>
                                Connect with classmates and form study groups for collaborative learning
                            </p>
                        </div>
                    </div>

                    {/* Trust Section */}
                    <div className={styles.trustSection}>
                        <p className={styles.trustText}>
                            Built with privacy & security at heart. All messages are moderated using trusted AI models.
                            <br /><span className={styles.ageInfo}>Designed for ages 8-14</span>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default LandingPage