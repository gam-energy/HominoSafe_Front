import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Greeting = () => {
  const { t } = useTranslation();
  return (
    <div
      key="overview"
      className="mx-auto flex size-full max-w-3xl flex-col justify-center px-8 md:mt-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        {t('ai_greeting', 'Hello there!')}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        {t('ai_greeting_sub', 'How can I help you today?')}
      </motion.div>
    </div>
  );
};
