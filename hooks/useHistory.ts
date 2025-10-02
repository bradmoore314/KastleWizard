import { useState, useCallback } from 'react';

interface History<T> {
    past: T[];
    present: T;
    future: T[];
}

export const useHistory = <T>(initialPresent: T) => {
    const [state, setState] = useState<History<T>>({
        past: [],
        present: initialPresent,
        future: [],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const set = useCallback((newPresent: T) => {
        const { present } = state;
        if (newPresent === present) {
            return;
        }
        setState({
            past: [...state.past, present],
            present: newPresent,
            future: [],
        });
    }, [state]);

    const undo = useCallback(() => {
        if (!canUndo) {
            return;
        }
        const { past, present, future } = state;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        setState({
            past: newPast,
            present: previous,
            future: [present, ...future],
        });
    }, [canUndo, state]);

    const redo = useCallback(() => {
        if (!canRedo) {
            return;
        }
        const { past, present, future } = state;
        const next = future[0];
        const newFuture = future.slice(1);
        setState({
            past: [...past, present],
            present: next,
            future: newFuture,
        });
    }, [canRedo, state]);

    const reset = useCallback((newPresent: T) => {
        setState({
            past: [],
            present: newPresent,
            future: [],
        });
    }, []);

    return { state: state.present, set, undo, redo, canUndo, canRedo, reset };
};