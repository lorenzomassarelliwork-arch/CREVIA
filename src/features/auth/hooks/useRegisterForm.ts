import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../../../navigation/types';
import { registerUser } from '../services/authService';
import {
  validateRegister,
  type RegisterErrors,
  type RegisterForm,
} from '../validators/authValidator';

type RegisterNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

type RegisterRoute = RouteProp<RootStackParamList, 'Register'>;

export function useRegisterForm(
  navigation: RegisterNavigation,
  route: RegisterRoute
) {
  const [form, setForm] = useState<RegisterForm>({
    nome: '',
    cognome: '',
    genere: '',
    dataNascita: '',
    email: '',
    mansione: '',
    settore: '',
    statoResidenza: '',
    cittaResidenza: '',
    statoDomicilio: '',
    cittaDomicilio: '',
    newsletter: false,
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [termini, setTermini] = useState<boolean>(false);
  const [erroreTermini, setErroreTermini] = useState<boolean>(false);

  // ritorno da schermata termini
  useEffect(() => {
    if (route.params?.terminiAccettati) {
      setTermini(true);
      setErroreTermini(false);
    }
  }, [route.params?.terminiAccettati]);

  const handleChange = <K extends keyof RegisterForm>(
    field: K,
    value: RegisterForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = selectedDate.toLocaleDateString('it-IT');
      handleChange('dataNascita', formatted);
    }
  };

  const handleWebDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      const [year, month, day] = value.split('-');
      handleChange('dataNascita', `${day}/${month}/${year}`);
    }
  };

  const handleRegister = async () => {
    const newErrors = validateRegister(form);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!termini) {
      setErroreTermini(true);
      return;
    }

    setLoading(true);

    const { success } = await registerUser(form);

    setLoading(false);

    if (!success) {
      setErrors({ email: 'Errore durante la registrazione. Riprova.' });
      return;
    }

    navigation.navigate('Login');
  };

  return {
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
  };
}
