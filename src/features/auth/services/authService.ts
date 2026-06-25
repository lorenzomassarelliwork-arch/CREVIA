import { resetPassword, login, register } from '../../../api/api';
import type { RegisterForm } from '../validators/authValidator';

type AuthServiceResult<TData = null> =
  | {
      success: true;
      data?: TData | null;
      error: null;
    }
  | {
      success: false;
      data?: null;
      error: string;
    };

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

//--------------------------------PER IL LOGIN--------------------------------
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthServiceResult<{ email: string }>> => {
  try {
    const { data, error } = await login(email, password);

    if (error) {
      return {
        success: false,
        data: null,
        error,
      };
    }

    return {
      success: true,
      data,
      error: null,
    };
  } catch (err) {
    console.error('Errore nel servizio di login:', err);

    return {
      success: false,
      data: null,
      error: getErrorMessage(err),
    };
  }
};





//--------------------------------PER IL RESET DELLA PASSWORD--------------------------------

export const requestPasswordReset = async (
  email: string
): Promise<AuthServiceResult> => {
  try {
    const { error } = await resetPassword(email);

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("Errore nel servizio di reset:", err);

    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
};


//---------------------------PER LA REGISTRAZIONE--------------------------
export const registerUser = async (
  form: RegisterForm
): Promise<AuthServiceResult> => {
  try {
    const { error } = await register(form);

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error(
      'Errore nel servizio di registrazione:',
      err
    );

    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
};
