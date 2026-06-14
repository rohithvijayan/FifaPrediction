import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchSelect.module.css';

interface Option {
  value: string;
  label: string;
  emoji?: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  allowCustom = false,
  customPlaceholder = 'Enter custom name...'
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    (option.value && option.value.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOption = options.find(opt => opt.value === value);
  const isCustomSelected = allowCustom && value.startsWith('custom:');
  const customValueText = isCustomSelected ? value.replace('custom:', '') : '';

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`custom:${e.target.value}`);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div 
        className={`${styles.trigger} ${disabled ? styles.disabled : ''} ${isOpen ? styles.active : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {isCustomSelected ? (
          <span className={styles.selectedValue}>✍️ Other: {customValueText || ''}</span>
        ) : selectedOption ? (
          <span className={styles.selectedValue}>
            {selectedOption.emoji && <span className={styles.emoji}>{selectedOption.emoji}</span>}
            {selectedOption.label}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={styles.arrow}>▼</span>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className={styles.optionsList}>
            {allowCustom && (
              <div 
                className={`${styles.optionItem} ${isCustomSelected ? styles.selected : ''}`}
                onClick={() => handleSelect('custom:')}
              >
                ✍️ Other (Type Name)...
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.optionItem} ${value === option.value ? styles.selected : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.emoji && <span className={styles.emoji}>{option.emoji}</span>}
                  {option.label}
                </div>
              ))
            ) : (
              !allowCustom && <div className={styles.noResults}>No options found</div>
            )}
          </div>
        </div>
      )}

      {isCustomSelected && (
        <input
          type="text"
          className={styles.customInput}
          placeholder={customPlaceholder}
          value={customValueText}
          onChange={handleCustomChange}
          required
          disabled={disabled}
        />
      )}
    </div>
  );
}
