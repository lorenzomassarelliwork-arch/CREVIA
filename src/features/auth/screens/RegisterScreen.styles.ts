import { StyleSheet } from 'react-native';
import type { CSSProperties } from 'react';

import { COLORS } from '../../../theme/colors';

const nativeStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.secondary,
  },
  inputError: {
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -8,
    marginLeft: 4,
  },
  label: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: -8,
  },
  facoltativo: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '400',
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionError: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 8,
  },
  optionButton: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.background,
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  datePlaceholder: {
    fontSize: 16,
    color: COLORS.gray,
  },
  dropdown: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.gray,
  },
  dropdownSelected: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  dropdownSearch: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    //backgroundColor: COLORS.disabled,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  link: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

const webDateInput: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 16,
  color: '#1A1A2E',
  width: '100%',
  outline: 'none',
  cursor: 'pointer',
};

export default {
  ...nativeStyles,
  webDateInput,
};
