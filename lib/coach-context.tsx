import { useAuth } from '@/lib/auth-context';
import { getCurrentLocation } from '@/lib/location';
import { ReflectionEngine } from '@/lib/reflection';
import { getLocalWeather } from '@/lib/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import React, { createContext, useContext, useEffect, useState } from 'react';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface CoachContextType {
    weather: any | null;
    greeting: string;
    icon: IconName;
    isNight: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const CoachContext = createContext<CoachContextType>({
    weather: null,
    greeting: "I'm here. Pace yourself.",
    icon: 'run',
    isNight: false,
    isLoading: false,
    refresh: async () => { },
});

export const useCoach = () => useContext(CoachContext);

export const CoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [weather, setWeather] = useState<any | null>(null);
    const [greeting, setGreeting] = useState("I'm here. Pace yourself.");
    const [icon, setIcon] = useState<IconName>('run');
    const [isNight, setIsNight] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadContext = async () => {
        setIsLoading(true);
        try {
            // Time check first
            const hour = new Date().getHours();
            const nightTime = hour >= 20 || hour < 5;
            setIsNight(nightTime);

            const location = await getCurrentLocation();
            let contextWeather = null;

            if (location) {
                const data = await getLocalWeather(location.latitude, location.longitude);
                if (data) {
                    contextWeather = {
                        temp: data.temperature,
                        isRaining: data.weatherCode >= 51 && data.weatherCode <= 67 || data.weatherCode >= 80,
                        condition: data.condition,
                        code: data.weatherCode,
                        isDay: data.isDay
                    };
                    setWeather(contextWeather);
                }
            }

            // Determine Icon
            let newIcon: IconName = 'run';
            if (contextWeather?.isRaining) {
                newIcon = 'weather-rainy';
            } else if (nightTime) {
                newIcon = 'weather-night';
            } else if (contextWeather?.temp && contextWeather.temp > 28) {
                newIcon = 'weather-sunny';
            } else if (contextWeather?.condition === 'Partly cloudy') {
                newIcon = 'weather-partly-cloudy';
            } else if (!nightTime) {
                // Default day icon if clear or unknown
                newIcon = 'weather-sunny';
            }
            setIcon(newIcon);

            // Generate Generative Greeting
            try {
                const mode = user.coachMode || 'mindful';
                const timeStr = nightTime ? 'night' : 'day';
                const weatherStr = contextWeather ? `${contextWeather.condition}, ${contextWeather.temp}°C` : 'unknown weather';

                const systemPrompt = `You are a running coach. The user is in '${mode}' mode.`;
                const prompt = `It is ${timeStr}. Weather is ${weatherStr}. Write a ONE sentence greeting (max 12 words). Be poetic and motivating. Do not ask questions.`;

                // Attempt to use Apple Intelligence (on-device)
                const { text } = await generateText({
                    model: apple(),
                    system: systemPrompt,
                    prompt: prompt,
                });

                if (text && text.length > 5) {
                    setGreeting(text.trim());
                    return; // Successfully generated AI greeting
                }
            } catch (aiError) {
                console.log('AI Generation failed, falling back to static:', aiError);
            }

            // Fallback to static greeting if AI fails or returns empty
            const msg = ReflectionEngine.getSmartGreeting(
                contextWeather ? {
                    temp: contextWeather.temp,
                    condition: contextWeather.condition,
                    isRaining: contextWeather.isRaining
                } : null,
                hour
            );
            setGreeting(msg);

        } catch (error) {
            console.log('Coach Context Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContext();
    }, [user.coachMode]); // Refresh when mode changes

    return (
        <CoachContext.Provider value={{ weather, greeting, icon, isNight, isLoading, refresh: loadContext }}>
            {children}
        </CoachContext.Provider>
    );
};
