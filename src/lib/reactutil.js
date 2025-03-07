let nextUpdaterId = 0;

const updaters = new Map();

function BasicComponent({ id, initialContent, color }) {
  const [content, setContent] = React.useState(initialContent);
  React.useEffect(() => {
    updaters.set(id, setContent)
    return () => updaters.delete(id);
  }, [id]);
  console.log(`input color: ${color}`);
  return React.createElement("span", {style: {color: color}}, content);
}

export function createBasicComponent(initialContent, color) {
  const id = nextUpdaterId++;
  return {
    component: React.createElement(BasicComponent, { id, initialContent, color }),
    updater: (content) => updaters.get(id)?.(content),
  }
}

function ProgressComponent({ id, initialContent }) {
  const [content, setContent] = React.useState(initialContent);
  React.useEffect(() => {
    updaters.set(id, setContent)
    return () => updaters.delete(id);
  }, [id]);
  return React.createElement("progress", {value: content}, null);
}

export function createProgressComponent(initialContent) {
  const id = nextUpdaterId++;
  return {
    component: React.createElement(ProgressComponent, { id, initialContent }),
    updater: (content) => updaters.get(id)?.(content),
  }
}


export const getTimestampText = () => `[${new Date().toLocaleTimeString("en-GB")}] `;