import './style.css'
import { MainView } from "./views/main";
import { ViewManager } from './views/view-manager';
import { AuthorizeView } from './views/authorize';
import { state } from './state';
import { API } from './api';


document.addEventListener("DOMContentLoaded", async () => {
  await state.load();
  const vm = new ViewManager();
  setInterval(() => {
    state.save();
  }, 10000);

  if (state.token === "" || state.apiUrl === "") {
    vm.push(new AuthorizeView(vm));
  } else {
    vm.push(new MainView(vm));
  }
  document.body.appendChild(vm.render() as HTMLElement);
});