import { Message } from "@/components/types";
import { useState, useEffect } from "react";



export const useMessages = () => {
    const [messages, setMessages] = useState<Message[]>([]);

    const getMessage = (messageId: string) => {
        return messages.find(msg => msg.id === messageId);
    }

    const hideMessage = (messageId: string) => {

        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isHidden: true } : msg));
    }

    const updateMessage = (message: Message) => {

        setMessages(prev => prev.map(msg => msg.id === message.id ? message : msg));
    }

    const addMessage = (message: Message) => {

        setMessages(prev => [...prev, message]);
    }

    const dateleMessage = (messageId: string) => {

        setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }

    return { messages, setMessages, getMessage, hideMessage, updateMessage, addMessage, dateleMessage };
};