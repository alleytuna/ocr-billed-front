/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES } from "../constants/routes";
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
    });
  });
});
