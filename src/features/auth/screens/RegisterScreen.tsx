import { useMemo } from 'react';
import type { CSSProperties, ChangeEvent, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { City, Country } from 'country-state-city';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { COLORS } from '../../../theme/colors';
import { useRegisterForm } from '../hooks/useRegisterForm';
import styles from './RegisterScreen.styles';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { translateUi } from '../../../i18n/uiTranslations';

type RegisterScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Register'
>;

type DropdownOption = {
  label: string;
  value: string;
};

type FormTextInputProps = TextInputProps & {
  error?: string;
};

type FormLabelProps = {
  title: string;
  description?: string;
};

type OptionGroupProps = {
  label: string;
  options: DropdownOption[];
  selectedValue: string;
  error?: string;
  onSelect: (value: string) => void;
};

type DropdownFieldProps = {
  label: string;
  error?: string;
  disabled?: boolean;
  data: DropdownOption[];
  value: string;
  onChange: (item: DropdownOption) => void;
  search?: boolean;
  maxHeight?: number;
  labelField: keyof DropdownOption;
  valueField: keyof DropdownOption;
  placeholder: string;
  searchPlaceholder?: string;
};

type CheckboxRowProps = {
  label?: string;
  checked: boolean;
  onPress: () => void;
  children?: ReactNode;
  error?: string;
};

type DateFieldProps = {
  label: string;
  value: string;
  error?: string;
  onPress: () => void;
  showPicker: boolean;
  date: Date;
  onDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onWebDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const genereOptions = ['Uomo', 'Donna', 'Non binario', 'Preferisco non dirlo'];
const mansioniOptions: DropdownOption[] = [
  { value: 'Studente', label: '🎓 Studente' },
  { value: 'Lavoratore', label: '💼 Lavoratore' },
];

function FormTextInput({ error, ...props }: FormTextInputProps) {
  return (
    <>
      <TextInput style={[styles.input, error && styles.inputError]} {...props} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

function FormLabel({ title, description }: FormLabelProps) {
  return (
    <Text style={styles.label}>
      {title}
      {description ? (
        <Text style={styles.facoltativo}>{description}</Text>
      ) : null}
    </Text>
  );
}

function OptionGroup({
  label,
  options,
  selectedValue,
  error,
  onSelect,
}: OptionGroupProps) {
  return (
    <>
      <FormLabel title={label} />
      <View style={[styles.optionContainer, error && styles.optionError]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedValue === option.value && styles.optionActive,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                selectedValue === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

function DropdownField({
  label,
  error,
  disabled,
  placeholder,
  searchPlaceholder,
  ...props
}: DropdownFieldProps) {
  const { language } = useAppPreferences();
  return (
    <>
      <FormLabel title={label} />
      <Dropdown
        style={[
          styles.dropdown,
          error && styles.inputError,
          disabled && styles.dropdownDisabled,
        ]}
        placeholderStyle={styles.dropdownPlaceholder}
        selectedTextStyle={styles.dropdownSelected}
        inputSearchStyle={styles.dropdownSearch}
        disable={disabled}
        placeholder={translateUi(placeholder ?? '', language)}
        searchPlaceholder={
          searchPlaceholder ? translateUi(searchPlaceholder, language) : undefined
        }
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

function CheckboxRow({
  label,
  checked,
  onPress,
  children,
  error,
}: CheckboxRowProps) {
  return (
    <>
      <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
        <View style={[styles.checkbox, checked && styles.checkboxActive]}>
          {checked ? (
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          ) : null}
        </View>
        <Text style={styles.checkboxText}>{children || label}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

function DateField({
  label,
  value,
  error,
  onPress,
  showPicker,
  date,
  onDateChange,
  onWebDateChange,
}: DateFieldProps) {
  const { language } = useAppPreferences();
  return (
    <>
      <FormLabel title={label} />
      {Platform.OS === 'web' ? (
        <View style={[styles.input, error && styles.inputError, styles.dateButton]}>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            onChange={onWebDateChange}
            onClick={(event) => event.currentTarget.showPicker()}
            style={styles.webDateInput as CSSProperties}
          />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.input, error && styles.inputError, styles.dateButton]}
          onPress={onPress}
        >
          <Text style={value ? styles.dateText : styles.datePlaceholder}>
            {value || 'Seleziona data'}
          </Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {showPicker && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
          locale={language === 'it' ? 'it-IT' : 'en-US'}
        />
      ) : null}
    </>
  );
}

export default function RegisterScreen({
  navigation,
  route,
}: RegisterScreenProps) {
  const {
    form,
    errors,
    loading,
    date,
    showDatePicker,
    setShowDatePicker,
    termini,
    erroreTermini,
    setTermini,
    setErroreTermini,
    handleChange,
    handleDateChange,
    handleWebDateChange,
    handleRegister,
  } = useRegisterForm(navigation, route);

  const paesiList = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: `${country.flag} ${country.name}`,
        value: country.isoCode,
      })),
    []
  );

  const getCitta = (isoCode: string): DropdownOption[] => {
    const citta = City.getCitiesOfCountry(isoCode) || [];
    return citta.map((city) => ({ label: city.name, value: city.name }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled>
      <View style={styles.header}>
        <Text style={styles.logo}>CREVIA</Text>
        <Text style={styles.subtitle}>Crea il tuo account</Text>
      </View>

      <View style={styles.form}>
        <FormTextInput
          placeholder="Nome *"
          placeholderTextColor={COLORS.gray}
          value={form.nome}
          onChangeText={(value) => handleChange('nome', value)}
          error={errors.nome}
        />

        <FormTextInput
          placeholder="Cognome *"
          placeholderTextColor={COLORS.gray}
          value={form.cognome}
          onChangeText={(value) => handleChange('cognome', value)}
          error={errors.cognome}
        />

        <OptionGroup
          label="Genere"
          options={genereOptions.map((value) => ({ value, label: value }))}
          selectedValue={form.genere}
          error={errors.genere}
          onSelect={(value) =>
            handleChange('genere', form.genere === value ? '' : value)
          }
        />

        <DateField
          label="Data di nascita *"
          value={form.dataNascita}
          error={errors.dataNascita}
          onPress={() => setShowDatePicker(true)}
          showPicker={showDatePicker}
          date={date}
          onDateChange={handleDateChange}
          onWebDateChange={handleWebDateChange}
        />

        <FormTextInput
          placeholder="Email *"
          placeholderTextColor={COLORS.gray}
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(value) => handleChange('email', value)}
          error={errors.email}
        />

        <OptionGroup
          label="Cosa fai nella vita? *"
          options={mansioniOptions}
          selectedValue={form.mansione}
          error={errors.mansione}
          onSelect={(value) => handleChange('mansione', value)}
        />

        <FormTextInput
          placeholder="Settore di interesse (facoltativo)"
          placeholderTextColor={COLORS.gray}
          value={form.settore}
          onChangeText={(value) => handleChange('settore', value)}
        />

        <DropdownField
          label="Stato di residenza *"
          data={paesiList}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Seleziona stato"
          searchPlaceholder="Cerca stato..."
          value={form.statoResidenza}
          onChange={(item) => {
            handleChange('statoResidenza', item.value);
            handleChange('cittaResidenza', '');
          }}
          error={errors.statoResidenza}
        />

        <DropdownField
          label="Città di residenza *"
          data={form.statoResidenza ? getCitta(form.statoResidenza) : []}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={
            form.statoResidenza ? 'Seleziona città' : 'Prima seleziona lo stato'
          }
          searchPlaceholder="Cerca città..."
          value={form.cittaResidenza}
          onChange={(item) => handleChange('cittaResidenza', item.value)}
          error={errors.cittaResidenza}
          disabled={!form.statoResidenza}
        />

        <DropdownField
          label="Stato di domicilio *"
          data={paesiList}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Seleziona stato"
          searchPlaceholder="Cerca stato..."
          value={form.statoDomicilio}
          onChange={(item) => {
            handleChange('statoDomicilio', item.value);
            handleChange('cittaDomicilio', '');
          }}
          error={errors.statoDomicilio}
        />

        <DropdownField
          label="Città di domicilio *"
          data={form.statoDomicilio ? getCitta(form.statoDomicilio) : []}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={
            form.statoDomicilio ? 'Seleziona città' : 'Prima seleziona lo stato'
          }
          searchPlaceholder="Cerca città..."
          value={form.cittaDomicilio}
          onChange={(item) => handleChange('cittaDomicilio', item.value)}
          error={errors.cittaDomicilio}
          disabled={!form.statoDomicilio}
        />

        <CheckboxRow
          checked={form.newsletter}
          onPress={() => handleChange('newsletter', !form.newsletter)}
          label="Voglio iscrivermi alla newsletter di CREVIA"
        />

        <CheckboxRow
          checked={termini}
          onPress={() => {
            if (!termini) {
              navigation.navigate('TerminiCondizioni');
            } else {
              setTermini(false);
              setErroreTermini(false);
            }
          }}
          error={
            erroreTermini
              ? 'Devi leggere e accettare i termini e condizioni'
              : undefined
          }
        >
          Ho letto e accetto i{' '}
          <Text style={styles.link}>Termini e Condizioni</Text> di CREVIA *
        </CheckboxRow>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Crea account</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hai già un account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Accedi</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
