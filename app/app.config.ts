export default defineAppConfig({
  ui: {
    colors: {
      primary: 'red',
      neutral: 'zinc'
    },
    navigationMenu: {
      slots: {
        link: 'font-display',
        childLink: 'font-display',
        label: 'font-display font-semibold'
      }
    }
  }
})
