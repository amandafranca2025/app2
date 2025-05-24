import { createTheme } from '@mui/material/styles';

// Tema inspirado na Uber (tema claro)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1f1f1f', // Preto/Cinza bem escuro para a AppBar ou elementos primários
    },
    secondary: {
      main: '#007cbf', // Azul vibrante para ações secundárias ou destaques
    },
    background: {
      default: '#f7f7f7', // Cinza muito claro para o fundo geral
      paper: '#FFFFFF',   // Branco para Paper e Cards
    },
    text: {
      primary: '#282828',   // Cinza escuro, quase preto, para texto principal
      secondary: '#5f5f5f', // Cinza mais claro para texto secundário
      // Para texto sobre fundo escuro (como na AppBar)
      contrastText: '#FFFFFF',
    },
    action: {
      active: '#007cbf', // Azul para ícones ativos ou links
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
      color: '#1f1f1f', // Usando a cor primária para títulos de destaque
    },
    h5: {
      fontWeight: 500,
      color: '#1f1f1f',
    },
    h6: {
      fontWeight: 500,
      color: '#1f1f1f',
    },
    button: {
      textTransform: 'none', // Botões da Uber geralmente não são ALL CAPS
      fontWeight: 'bold',
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Exemplo: AppBar escura com texto claro
          backgroundColor: '#1f1f1f', // primary.main
          color: '#FFFFFF', // theme.palette.text.contrastText
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Cantos um pouco mais arredondados
          padding: '10px 20px', // Ajuste de padding
        },
        containedPrimary: { // Botão primário (ex: Entrar, Salvar)
          backgroundColor: '#1f1f1f',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#333333', // Um pouco mais claro no hover
          },
        },
        containedSecondary: { // Botão secundário (ex: Ver Rota)
          backgroundColor: '#007cbf',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#005a8c', // Um pouco mais escuro no hover
          },
        },
        outlinedPrimary: {
            borderColor: '#1f1f1f',
            color: '#1f1f1f',
             '&:hover': {
                backgroundColor: 'rgba(31, 31, 31, 0.04)', // Leve fundo no hover
                borderColor: '#1f1f1f',
            },
        },
         outlinedSecondary: {
            borderColor: '#007cbf',
            color: '#007cbf',
             '&:hover': {
                backgroundColor: 'rgba(0, 124, 191, 0.04)',
                borderColor: '#007cbf',
            },
        }
      },
    },
    MuiPaper: {
        styleOverrides: {
            elevation1: {
                boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.06), 0px 1px 10px 0px rgba(0,0,0,0.04)', // Sombra mais suave
            },
            elevation3: {
                 boxShadow: '0px 4px 10px -2px rgba(0,0,0,0.08), 0px 8px 12px 0px rgba(0,0,0,0.06), 0px 1px 20px 0px rgba(0,0,0,0.05)',
            }
        }
    },
    MuiCard: {
        styleOverrides: {
            root: {
                 borderRadius: '12px', // Cantos mais arredondados para Cards
            }
        }
    }
  },
});

export default theme;
