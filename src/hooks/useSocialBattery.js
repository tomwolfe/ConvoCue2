import { useState, useCallback, useRef, useEffect } from 'react';
import { AppConfig } from '../core/config';

export const useSocialBattery = () => {
    const [battery, setBattery] = useState(100);
    const [sensitivity, setSensitivity] = useState(AppConfig.agency.defaultSensitivity);
    const [isPaused, setIsPaused] = useState(false);
    
    const batteryRef = useRef(battery);

    useEffect(() => {
        batteryRef.current = battery;
    }, [battery]);

    const deduct = useCallback((text, intent, personaKey = 'anxiety') => {
        if (isPaused) return batteryRef.current;

        const wordCount = text.trim().split(/\s+/).length;
        const baseDeduction = wordCount * AppConfig.batteryDeduction.baseRate;
        const multiplier = AppConfig.batteryDeduction.multipliers[intent] || 1.0;
        
        // Apply persona-specific drain rate
        const personaConfig = AppConfig.personas[personaKey] || AppConfig.personas[AppConfig.defaultPersona];
        const drainRate = personaConfig.drainRate || 1.0;
        
        // Apply user-defined sensitivity
        const totalDeduction = Math.min(15, Math.max(2, baseDeduction * multiplier * drainRate * sensitivity));
        
        setBattery(prev => {
            const newVal = Math.max(0, prev - totalDeduction);
            batteryRef.current = newVal;
            return newVal;
        });
        
        return batteryRef.current;
    }, [isPaused, sensitivity]);

    const reset = useCallback(() => setBattery(100), []);
    const togglePause = useCallback(() => setIsPaused(p => !p), []);
    const recharge = useCallback((amount) => setBattery(prev => Math.min(100, prev + amount)), []);

    return { 
        battery, deduct, reset, batteryRef, 
        sensitivity, setSensitivity, 
        isPaused, togglePause,
        recharge
    };
};
