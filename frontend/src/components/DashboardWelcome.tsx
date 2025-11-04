import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const GREETINGS = [
  "What's up",
  "Hey there",
  "Welcome back",
  "Good to see you",
  "Hello",
  "Hi",
  "Howdy",
];

const EMOJI_REACTIONS = [
  "👋",
  "🎮",
  "🚀",
  "✨",
  "💫",
  "🔥",
  "⚡",
  "🎯",
];

const TIME_BASED_GREETINGS = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardWelcome() {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    // 50% chance für time-based greeting, 50% für random
    const useTimeBased = Math.random() > 0.5;
    
    if (useTimeBased) {
      setGreeting(TIME_BASED_GREETINGS());
    } else {
      setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    }
    
    setEmoji(EMOJI_REACTIONS[Math.floor(Math.random() * EMOJI_REACTIONS.length)]);
  }, []);

  const getFirstName = () => {
    if (!user?.email) return 'there';
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3">
        <motion.h1
          className="text-4xl font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {greeting}, {getFirstName()}! <span className="inline-block animate-bounce">{emoji}</span>
        </motion.h1>
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
          }}
          transition={{
            duration: 0.5,
            delay: 0.5,
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
      </div>
      <motion.p
        className="text-muted-foreground mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Ready to manage your servers?
      </motion.p>
    </motion.div>
  );
}
