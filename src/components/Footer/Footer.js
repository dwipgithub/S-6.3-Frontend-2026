// src/Footer.js
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p>&copy; {new Date().getFullYear()} SIRS 6 Versi 3.0.0</p>
            </div>
        </footer>
    );
}

export default Footer;
