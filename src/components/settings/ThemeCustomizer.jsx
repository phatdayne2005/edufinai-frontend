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
              data-pressed={theme === option.id}
              className="card-interactive"
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
            const isActive = accentColor === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-label={`Chọn màu ${option.label}`}
                onClick={() => setAccentColor(option.id)}
                style={{
                  ...styles.accentButton,
                  ...(isActive ? styles.accentButtonActive : {}),
                  '--card-interactive-color': accentColorValue,
                }}
                data-pressed={isActive}
                className="card-interactive"
              >
                <div
                  style={{
                    ...styles.accentSwatch,
                    ...(isActive ? styles.accentSwatchActive : {}),
                    backgroundColor: accentColorValue,
                  }}
                >
                  {isActive && <div style={styles.accentCheck}>✓</div>}
                </div>
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

