module.exports = {
  content: ['./src/**/*.{html,scss,ts}'],
  theme: {
    extend: {
      colors: {
        gwt: {
          back: '#00000088',
          semi: '#88888888',
          light: '#D4BA77DD',
          brown: '#461C0FDD',
          amber: '#85421BDD'
        }
      },
      fontSize: {
        tiny: '.6rem'
      },
      width: {
        menu: '50px',
        card: '420px',
        panel: '425px',
        simulationPanel: '550px',
        calculatedTagPanel: '650px',
        modalLarge: '70vw'
      },
      height: {
        header: '58px',
        modalLarge: '60vh',
        drawArea: '262px',
        expandedDrawArea: '512px'
      },
      screens: {
        '3xl': '2500px'
      }
    },
    plugins: []
  }
};
