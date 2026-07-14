import React from "react";
import { motion } from "framer-motion";

export default function AuthCard({ children }) {
    return (
        <motion.div
            className="auth-card"
            initial={{ opacity: 0, scale: 0.96, y: 15, rotateX: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            transition={{ 
                duration: 0.6, 
                type: "spring",
                stiffness: 70,
                damping: 15
            }}
        >
            {children}
        </motion.div>
    );
}
