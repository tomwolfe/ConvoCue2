/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useSocialBattery } from '../useSocialBattery';
import { AppConfig } from '../../core/config';
import { jest } from '@jest/globals';

describe('useSocialBattery', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Reset Date.now to a fixed value
        jest.setSystemTime(new Date('2026-01-27T10:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should initialize with 100% battery', () => {
        const { result } = renderHook(() => useSocialBattery());
        expect(result.current.battery).toBe(100);
    });

    test('should deduct battery based on text and intent', () => {
        const { result } = renderHook(() => useSocialBattery());
        
        act(() => {
            result.current.deduct('This is a test message to drain battery.', 'professional');
        });

        // professional multiplier is 1.0
        // baseRate is usually small, so we just expect it to be less than 100
        expect(result.current.battery).toBeLessThan(100);
    });

    test('should apply different multipliers for conflict', () => {
        const { result: result1 } = renderHook(() => useSocialBattery());
        const { result: result2 } = renderHook(() => useSocialBattery());

        act(() => {
            result1.current.deduct('Conflict message', 'conflict');
            result2.current.deduct('Social message', 'social');
        });

        // Conflict should drain more than social
        const drain1 = 100 - result1.current.battery;
        const drain2 = 100 - result2.current.battery;
        expect(drain1).toBeGreaterThan(drain2);
    });

    test('should trigger passive recovery after 10 seconds of idle time', () => {
        const { result } = renderHook(() => useSocialBattery());
        
        act(() => {
            result.current.setBattery(50);
        });
        expect(result.current.battery).toBe(50);

        // Advance time by 11 seconds (idle > 10s)
        act(() => {
            jest.advanceTimersByTime(11000);
        });

        // Passive recovery runs every 5 seconds. 
        // 11 seconds should trigger it at least once.
        expect(result.current.battery).toBeGreaterThan(50);
    });

    test('should trigger recovery surge after 3 positive intents', () => {
        const { result } = renderHook(() => useSocialBattery());
        
        act(() => {
            result.current.setBattery(50);
        });

        // 3 positive intents
        act(() => {
            result.current.deduct('Great!', 'positive');
            result.current.deduct('Wonderful!', 'positive');
            result.current.deduct('Excellent!', 'positive');
        });

        const batteryAfterStreaks = result.current.battery;

        // Advance time by 5 seconds to trigger recovery
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // Recovery surge should apply a 2x multiplier or at least a minimum recovery
        expect(result.current.battery).toBeGreaterThan(batteryAfterStreaks);
        expect(result.current.lastDrain.reason).toBe('recovery surge');
    });

    test('should identify exhausted state at 15% threshold', () => {
        const { result } = renderHook(() => useSocialBattery());
        
        act(() => {
            result.current.setBattery(14);
        });

        expect(result.current.isExhausted).toBe(true);
    });
});
