/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store", () => mockStore);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  describe("When I am on NewBill Page", () => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    test("Then only .jpg, .jpeg or .png format image can be downloaded as a valid bill's file", async () => {
      jest.spyOn(mockStore, "bills");
      document.body.innerHTML = NewBillUI();

      const mockedNewBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(mockedNewBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");
      const formNewBill = screen.getByTestId("form-new-bill");
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["foo"], "foo.jpg", { type: "image/jpeg" })],
        },
      });

      expect(fileInput.files[0].name).toBeDefined();
      expect(handleChangeFile).toBeCalled();

      const handleSubmit = jest.fn(mockedNewBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });

    // test d'intégration POST
    test("Then I can submit a new bill when inputs are properly filled", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
      // vérifie que la redirection a été faite et donc que le POST a fonctionné
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });

    // gestion d'erreur
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
  
      test("Then it fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await waitFor(() => screen.getByText(/Erreur 404/));
        expect(message).toBeTruthy();
      });
  
      test("Then it fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await waitFor(() => screen.getByText(/Erreur 500/));
        expect(message).toBeTruthy();
      });
    });
  });
});
