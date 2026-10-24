import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: string;
  group?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  className = '',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      const matchGroup = opt.group ? opt.group.toLowerCase().includes(q) : false;
      const matchVal = opt.value.toLowerCase().includes(q);
      return matchLabel || matchSub || matchBadge || matchGroup || matchVal;
    });
  }, [options, searchTerm]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form compatibility if name given */}
      {name && <input type="hidden" name={name} value={value} id={id} />}

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="input-field"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          padding: '8px 12px',
          fontWeight: 600,
          backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
          borderColor: isOpen ? 'var(--slt-deep-blue, #002B49)' : undefined,
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 43, 73, 0.12)' : undefined,
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption ? 'var(--text-primary, #0F172A)' : 'var(--text-muted, #94A3B8)',
            fontSize: '0.88rem',
            marginRight: 8,
          }}
        >
          {selectedOption ? (
            <span>
              <strong>{selectedOption.label}</strong>
              {selectedOption.subLabel && (
                <span style={{ color: 'var(--text-secondary, #475569)', fontWeight: 500, marginLeft: 6 }}>
                  — {selectedOption.subLabel}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: 'var(--text-secondary, #64748B)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 340,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Top Search Input Box */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted, #64748B)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text-primary, #0F172A)',
                fontWeight: 500,
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted, #64748B)',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results Summary Bar */}
          <div
            style={{
              padding: '4px 12px',
              backgroundColor: '#F1F5F9',
              fontSize: '0.72rem',
              color: 'var(--text-muted, #64748B)',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {searchTerm
                ? `${filteredOptions.length} match${filteredOptions.length === 1 ? '' : 'es'} found`
                : `${options.length} total options`}
            </span>
            <span>Use ↑↓ arrows & Enter</span>
          </div>

          {/* Scrollable List */}
          <div
            ref={listRef}
            style={{
              overflowY: 'auto',
              maxHeight: 250,
              padding: '4px',
            }}
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #64748B)',
                  fontSize: '0.85rem',
                }}
              >
                <div>No matching options for <strong>"{searchTerm}"</strong></div>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginTop: 8,
                    fontSize: '0.75rem',
                    color: 'var(--slt-deep-blue, #002B49)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      backgroundColor: isSelected
                        ? '#EFF6FF'
                        : isHighlighted
                        ? '#F8FAFC'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--slt-deep-blue, #002B49)'
                        : 'var(--text-primary, #0F172A)',
                      transition: 'background-color 0.1s',
                      opacity: opt.disabled ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontWeight: isSelected ? 800 : 700,
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {opt.label}
                        </span>
                        {opt.group && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 5px',
                              borderRadius: 3,
                              backgroundColor: '#E2E8F0',
                              color: 'var(--text-secondary, #475569)',
                              fontWeight: 600,
                            }}
                          >
                            {opt.group}
                          </span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary, #475569)',
                            marginTop: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.subLabel}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            backgroundColor: opt.badgeColor || '#F1F5F9',
                            color: opt.badgeColor ? '#FFFFFF' : 'var(--text-secondary, #334155)',
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={16} color="var(--slt-deep-blue, #002B49)" style={{ strokeWidth: 3 }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
