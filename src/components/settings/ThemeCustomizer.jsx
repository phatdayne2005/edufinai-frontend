import React from 'react';
import { Palette, Moon, Sun, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';

const ThemeCustomizer = () => {
  const {
    theme,
    setTheme,
    themeOptions,
    accentColor,
    setAccentColor,
    accentOptions,
    reduceMotion,
    setReduceMotion,
  } = useApp();

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <Palette size={24} style={{ color: 'var(--color-primary)' }} />
        <h3 style={styles.sectionTitle}>Tùy chỉnh giao diện</h3>
      </div>

      {/* Theme Selection */}
      <div style={styles.themeCard}>
        <div style={styles.themeSectionHeader}>
          <div>
            <h4 style={styles.themeSectionTitle}>Chế độ hiển thị</h4>
            <p style={styles.themeSectionSubtitle}>Chọn giao diện sáng hoặc tối</p>
          </div>
        </div>
        <div style={styles.themeOptionRow}>
          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              style={{
                ...styles.themeOptionButton,
                ...(theme === option.id ? styles.themeOptionActive : {}),
              }}
            >
              {option.id === 'light' ? (
                <Sun size={24} style={{ marginBottom: '8px' }} />
              ) : (
                <Moon size={24} style={{ marginBottom: '8px' }} />
              )}
              <span style={{ fontWeight: 600, marginBottom: '4px' }}>{option.label}</span>
              <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Selection */}
      <div style={styles.themeCard}>
        <div style={styles.themeSectionHeader}>
          <div>
            <h4 style={styles.themeSectionTitle}>Màu nhấn</h4>
            <p style={styles.themeSectionSubtitle}>Chọn màu chủ đạo cho ứng dụng</p>
          </div>
        </div>
        <div style={styles.themeAccentGrid}>
          {accentOptions.map((option) => {
            const accentColorValue = `hsl(${option.hue}, ${option.saturation}%, ${option.lightness}%)`;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccentColor(option.id)}
                style={{
                  ...styles.accentButton,
                  ...(accentColor === option.id ? styles.accentButtonActive : {}),
                }}
              >
                <div
                  style={{
                    ...styles.accentSwatch,
                    backgroundColor: accentColorValue,
                  }}
                />
                <span style={styles.accentLabel}>{option.label}</span>
                {accentColor === option.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reduce Motion Toggle */}
      <div style={styles.themeCard}>
        <div style={styles.toggleRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={styles.toggleLabel}>Giảm chuyển động</span>
              <p style={{ ...styles.themeSectionSubtitle, margin: '4px 0 0 0' }}>
                Tắt hiệu ứng animation để tăng hiệu suất
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReduceMotion(!reduceMotion)}
            style={{
              ...styles.toggleSwitch,
              ...(reduceMotion ? styles.toggleSwitchActive : {}),
            }}
            aria-label="Toggle reduce motion"
          >
            <div
              style={{
                ...styles.toggleKnob,
                ...(reduceMotion ? styles.toggleKnobActive : {}),
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;

