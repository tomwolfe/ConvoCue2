import { useState, useCallback, useRef, useEffect } from 'react';
import { AppConfig } from '../core/config';

export const useSocialBattery = () => {
    const [battery, setBattery] = useState(100);
    const batteryRef = useRef(battery);

    useEffect(() => {
        batteryRef.current = battery;
    }, [battery]);

    const deduct = useCallback((text, intent) => {
        const wordCount = text.trim().split(/\s+/).length;
        const baseDeduction = wordCount * AppConfig.batteryDeduction.baseRate;
        const multiplier = AppConfig.batteryDeduction.multipliers[intent] || 1.0;
        const totalDeduction = Math.min(15, Math.max(2, baseDeduction * multiplier));
        
        setBattery(prev => {
            const newVal = Math.max(0, prev - totalDeduction);
            batteryRef.current = newVal;
            return newVal;
        });
        
        return batteryRef.current;
    }, []);

    const reset = useCallback(() => setBattery(100), []);

    return { battery, deduct, reset, batteryRef };
};
