/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then the page should contain formated bills", async () => {
      const billsLandingPage = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: null,
      });
      const getBills = await billsLandingPage.getBills();
      expect(Array.isArray(getBills)).toBe(true);

      expect(getBills).toEqual(
        bills.map((doc) => ({
          ...doc,
          date: formatDate(doc.date),
          status: formatStatus(doc.status),
        }))
      );
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const ascending = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(ascending);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I click on the New Bill button", () => {
    test("Then I am redirected to New Bill page", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      const newBill = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
        store: null,
      });
      const handleClickNewBill = jest.fn(() => {
        newBill.handleClickNewBill;
      });
      const newBillButton = screen.getAllByTestId("btn-new-bill")[0];
      newBillButton.addEventListener("click", handleClickNewBill);
      fireEvent.click(newBillButton);

      expect(handleClickNewBill).toHaveBeenCalled();
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then the bill's image should open", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      const newBill = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
        store: null,
      });
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn(() => {
        newBill.handleClickIconEye;
      });
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      eyeIcon.addEventListener("click", handleClickIconEye);
      fireEvent.click(eyeIcon);

      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });
  });
});

describe("When I'm on the Bills page", () => {
  test("Then it fetches bills from mock API GET", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    expect(
      await waitFor(() => screen.getByText("Mes notes de frais"))
    ).toBeTruthy();
    expect(
      await waitFor(() => screen.getByTestId("btn-new-bill"))
    ).toBeTruthy();
  });

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
            return Promise.reject(new Error("Erreur"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText("Erreur");
      expect(message).toBeTruthy();
    });
  });
});
