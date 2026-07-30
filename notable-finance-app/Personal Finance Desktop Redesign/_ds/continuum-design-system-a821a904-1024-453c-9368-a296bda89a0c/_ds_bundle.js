/* @ds-bundle: {"format":4,"namespace":"ContinuumDesignSystem_a821a9","components":[{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"List","sourcePath":"components/data/List.jsx"},{"name":"ListRow","sourcePath":"components/data/List.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Progress","sourcePath":"components/feedback/Progress.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Progress.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"NavigationBar","sourcePath":"components/navigation/NavigationBar.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"},{"name":"Sheet","sourcePath":"components/overlays/Modal.jsx"}],"sourceHashes":{"components/data/Card.jsx":"f5fcbdc34c1b","components/data/List.jsx":"ee9fcca86f41","components/feedback/Alert.jsx":"dcacf1208d8f","components/feedback/Badge.jsx":"95b0123c2742","components/feedback/Progress.jsx":"a6831cd988d1","components/feedback/Toast.jsx":"69f888454cbc","components/feedback/Tooltip.jsx":"c07e5a48e6cb","components/forms/Button.jsx":"e2895cc2546c","components/forms/Checkbox.jsx":"5724cedb0533","components/forms/IconButton.jsx":"9af26a9d7817","components/forms/Radio.jsx":"003e94eacf97","components/forms/SegmentedControl.jsx":"fbcad6a5299d","components/forms/Slider.jsx":"3d9ee4582b24","components/forms/Switch.jsx":"379d1c39b742","components/forms/TextField.jsx":"ad8cd197d6b2","components/navigation/NavigationBar.jsx":"a04e6bed89a8","components/navigation/TabBar.jsx":"c5213d8282bb","components/navigation/Tabs.jsx":"c0f78811912c","components/overlays/Modal.jsx":"f48f5dbfbfb2","ui_kits/notes/LoginScreen.jsx":"687c413a374e","ui_kits/notes/NotesShell.jsx":"f1211e37eee4"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ContinuumDesignSystem_a821a9 = window.ContinuumDesignSystem_a821a9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Card.jsx
try { (() => {
function Card({
  children,
  elevated = false,
  flat = false,
  style
}) {
  const cls = ['card', elevated ? 'card--elevated' : '', flat ? 'card--flat' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    style: style
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/List.jsx
try { (() => {
function List({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "list"
  }, children);
}
function ListRow({
  icon,
  iconTone,
  title,
  subtitle,
  trailing,
  chevron = false,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "list-row",
    onClick: onClick
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "list-row-icon",
    style: {
      background: iconTone || 'var(--accent)'
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "list-row-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "list-row-title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "list-row-subtitle"
  }, subtitle)), trailing, chevron && /*#__PURE__*/React.createElement("span", {
    className: "list-row-chevron"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "15",
    viewBox: "0 0 9 15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6.5 6.5L1 14"
  }))));
}
Object.assign(__ds_scope, { List, ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/List.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function Alert({
  tone = 'info',
  title,
  children,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `alert alert--${tone}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "alert-icon"
  }, icon), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "alert-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "alert-body"
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  children,
  tone = 'danger',
  outline = false
}) {
  const cls = outline ? 'badge badge--outline' : `badge${tone !== 'danger' ? ` badge--${tone}` : ''}`;
  return /*#__PURE__*/React.createElement("span", {
    className: cls
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Progress.jsx
try { (() => {
function Progress({
  value,
  indeterminate = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `progress${indeterminate ? ' progress--indeterminate' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar",
    style: indeterminate ? undefined : {
      width: `${value}%`
    }
  }));
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  });
}
Object.assign(__ds_scope, { Progress, Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Progress.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  children,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, icon, children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  children,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "tooltip"
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "tooltip-bubble"
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function Button({
  variant = 'primary',
  size = 'medium',
  square = false,
  disabled = false,
  icon,
  children,
  onClick,
  type = 'button'
}) {
  const cls = ['btn', `btn--${variant}`, size === 'small' ? 'btn--small' : size === 'large' ? 'btn--large' : '', square ? 'btn--square' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    className: cls,
    disabled: disabled,
    onClick: onClick
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  onChange,
  label,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "checkbox"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "checkbox-box"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 8l3.5 3.5L13 4.5"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  plain = false,
  size = 'md',
  label,
  onClick,
  disabled = false
}) {
  const cls = ['icon-btn', plain ? 'icon-btn--plain' : '', size === 'sm' ? 'icon-btn--sm' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cls,
    "aria-label": label,
    onClick: onClick,
    disabled: disabled
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  checked,
  onChange,
  label,
  name,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "radio"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    checked: checked,
    onChange: onChange,
    name: name,
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "radio-dot"
  }), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function SegmentedControl({
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "segmented",
    role: "tablist"
  }, options.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt.value,
    role: "tab",
    "aria-selected": opt.value === value,
    onClick: () => onChange(opt.value)
  }, opt.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("input", {
    className: "slider",
    type: "range",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: onChange
  }));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  onChange,
  disabled = false,
  label
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "switch",
    "aria-label": label
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled
  }), /*#__PURE__*/React.createElement("span", {
    className: "switch-track"
  }), /*#__PURE__*/React.createElement("span", {
    className: "switch-thumb"
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function TextField({
  label,
  placeholder,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  multiline = false,
  disabled = false
}) {
  const id = React.useId();
  return /*#__PURE__*/React.createElement("div", {
    className: `field${error ? ' field--error' : ''}`
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: id
  }, label), multiline ? /*#__PURE__*/React.createElement("textarea", {
    id: id,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    rows: 4
  }) : /*#__PURE__*/React.createElement("input", {
    id: id,
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled
  }), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: `field-hint${error ? ' field-hint--error' : ''}`
  }, error || hint));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavigationBar.jsx
try { (() => {
function NavigationBar({
  title,
  leading,
  trailing
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "navbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "navbar-side"
  }, leading), /*#__PURE__*/React.createElement("div", {
    className: "navbar-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "navbar-side navbar-side--end"
  }, trailing));
}
Object.assign(__ds_scope, { NavigationBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavigationBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function TabBar({
  items,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tabbar"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    className: "tabbar-item",
    "aria-selected": it.value === value,
    onClick: () => onChange(it.value)
  }, it.icon, /*#__PURE__*/React.createElement("span", null, it.label))));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    "aria-selected": it.value === value,
    onClick: () => onChange(it.value)
  }, it.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
function Modal({
  open,
  title,
  children,
  actions,
  onClose
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, title && /*#__PURE__*/React.createElement("h3", {
    className: "modal-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, children), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, actions)));
}
function Sheet({
  open,
  children,
  onClose
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "sheet-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-grabber"
  }), children));
}
Object.assign(__ds_scope, { Modal, Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notes/LoginScreen.jsx
try { (() => {
const {
  TextField,
  Button
} = window.ContinuumDesignSystem_a821a9;
function LoginScreen({
  onSignIn
}) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 24,
      padding: 32,
      boxSizing: 'border-box',
      background: 'var(--bg-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 18,
      background: 'var(--accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://unpkg.com/lucide-static/icons/notebook-pen.svg",
    style: {
      width: 32,
      height: 32,
      filter: 'invert(1)'
    },
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-2)',
      color: 'var(--label-1)'
    }
  }, "Sign in to Notes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      width: '100%',
      maxWidth: 280
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Email",
    placeholder: "you@example.com",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Password",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: pw,
    onChange: e => setPw(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: onSignIn
  }, "Sign In"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "small"
  }, "Forgot password?")));
}
window.NotesKit = Object.assign(window.NotesKit || {}, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notes/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notes/NotesShell.jsx
try { (() => {
const {
  NavigationBar,
  TabBar,
  List,
  ListRow,
  IconButton,
  TextField,
  Badge
} = window.ContinuumDesignSystem_a821a9;
const FOLDERS = [{
  id: 'all',
  name: 'All Notes',
  count: 6,
  icon: 'notebook'
}, {
  id: 'work',
  name: 'Work',
  count: 3,
  icon: 'briefcase'
}, {
  id: 'personal',
  name: 'Personal',
  count: 2,
  icon: 'user'
}, {
  id: 'recipes',
  name: 'Recipes',
  count: 1,
  icon: 'chef-hat'
}];
const NOTES = [{
  id: 1,
  title: 'Q3 roadmap review',
  preview: 'Discuss timeline slip on the billing migration…',
  date: '9:41 AM',
  folder: 'work',
  pinned: true
}, {
  id: 2,
  title: 'Grocery list',
  preview: 'Eggs, oat milk, sourdough, basil, parmesan',
  date: 'Yesterday',
  folder: 'recipes'
}, {
  id: 3,
  title: 'Trip packing list',
  preview: 'Passport, adapter, hiking boots, sunscreen',
  date: 'Yesterday',
  folder: 'personal'
}, {
  id: 4,
  title: '1:1 notes — Sam',
  preview: 'Promo packet due Friday, review with skip level',
  date: 'Mon',
  folder: 'work',
  pinned: true
}, {
  id: 5,
  title: 'Book recs from Alex',
  preview: 'The Overstory, Piranesi, Project Hail Mary',
  date: 'Mon',
  folder: 'personal'
}, {
  id: 6,
  title: 'Standup notes',
  preview: 'Blocked on design review for onboarding v2',
  date: 'Sun',
  folder: 'work'
}];
function Icon({
  name,
  size = 18,
  style
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: `https://unpkg.com/lucide-static/icons/${name}.svg`,
    width: size,
    height: size,
    style: style,
    alt: ""
  });
}
function NoteList({
  folder,
  notes,
  selected,
  onSelect,
  onNew
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement(NavigationBar, {
    title: folder.name,
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "square-pen"
      }),
      label: "New note",
      plain: true,
      onClick: onNew
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    placeholder: "Search"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 10px 10px'
    }
  }, /*#__PURE__*/React.createElement(List, null, notes.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    style: {
      background: selected === n.id ? 'var(--fill-4)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    title: /*#__PURE__*/React.createElement("span", null, n.pinned && /*#__PURE__*/React.createElement(Icon, {
      name: "pin",
      size: 12,
      style: {
        marginRight: 4,
        verticalAlign: -1
      }
    }), n.title),
    subtitle: `${n.date}  ${n.preview}`,
    onClick: () => onSelect(n.id)
  }))))));
}
function NoteEditor({
  note,
  onDelete,
  onBack,
  showBack
}) {
  const [title, setTitle] = React.useState(note.title);
  const [body, setBody] = React.useState(note.preview + '\n\nMore details go here…');
  React.useEffect(() => {
    setTitle(note.title);
    setBody(note.preview + '\n\nMore details go here…');
  }, [note.id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement(NavigationBar, {
    title: note.date,
    leading: showBack ? /*#__PURE__*/React.createElement("button", {
      className: "navbar-action",
      onClick: onBack
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-left",
      size: 16,
      style: {
        verticalAlign: -3
      }
    }), "Notes") : null,
    trailing: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "share"
      }),
      label: "Share",
      plain: true
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "trash-2"
      }),
      label: "Delete",
      plain: true,
      onClick: onDelete
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '20px 24px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    style: {
      border: 'none',
      outline: 'none',
      width: '100%',
      font: 'var(--text-title-2)',
      color: 'var(--label-1)',
      background: 'transparent',
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-footnote)',
      color: 'var(--label-2)',
      marginBottom: 14
    }
  }, note.date, " at 9:41 AM"), /*#__PURE__*/React.createElement("textarea", {
    value: body,
    onChange: e => setBody(e.target.value),
    style: {
      border: 'none',
      outline: 'none',
      width: '100%',
      height: 300,
      resize: 'none',
      font: 'var(--text-body)',
      color: 'var(--label-1)',
      background: 'transparent',
      fontFamily: 'var(--font-text)'
    }
  })));
}
function Sidebar({
  folders,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg-2)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 8px',
      font: 'var(--text-title-3)'
    }
  }, "Notes"), /*#__PURE__*/React.createElement(List, null, folders.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      background: active === f.id ? 'var(--fill-3)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: f.icon,
      size: 16,
      style: {
        filter: 'invert(1)'
      }
    }),
    iconTone: "var(--accent)",
    title: f.name,
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, f.count),
    onClick: () => onSelect(f.id)
  })))));
}
window.NotesKit = Object.assign(window.NotesKit || {}, {
  FOLDERS,
  NOTES,
  Icon,
  NoteList,
  NoteEditor,
  Sidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notes/NotesShell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Card = __ds_scope.Card;

__ds_ns.List = __ds_scope.List;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.NavigationBar = __ds_scope.NavigationBar;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Sheet = __ds_scope.Sheet;

})();
