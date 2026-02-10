import { useState, useEffect, useCallback, useRef } from 'react';
import { PRESETS } from '../models/presets';
import { loadTemplates, saveTemplate, deleteTemplate } from '../utils/universalStorage';

export function useGameTemplates() {
  const [customTemplates, setCustomTemplates] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const templates = loadTemplates();
    if (isMounted.current) {
      setCustomTemplates(templates);
    }
  }, []);

  const allTemplates = [...PRESETS, ...customTemplates];

  const addTemplate = useCallback((template) => {
    saveTemplate(template);
    setCustomTemplates(prev => [...prev, template]);
  }, []);

  const updateTemplate = useCallback((template) => {
    saveTemplate(template);
    setCustomTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  }, []);

  const removeTemplate = useCallback((id) => {
    deleteTemplate(id);
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTemplate = useCallback((id) => {
    return allTemplates.find(t => t.id === id) || null;
  }, [allTemplates]);

  return {
    templates: allTemplates,
    presets: PRESETS,
    customTemplates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    getTemplate,
  };
}
