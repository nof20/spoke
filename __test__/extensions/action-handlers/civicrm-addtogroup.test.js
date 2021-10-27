import { when } from "jest-when";
import {
  validateActionHandler,
  validateActionHandlerWithClientChoices
} from "../../../src/extensions/action-handlers";
import { searchGroups } from "../../../src/extensions/contact-loaders/civicrm/util";

import * as HandlerToTest from "../../../src/extensions/action-handlers/civicrm-addtogroup";
import { getConfig, hasConfig } from "../../../src/server/api/lib/config";

jest.mock("../../../src/server/api/lib/config");
jest.mock("../../../src/extensions/contact-loaders/civicrm/util");

describe("civicrm-addtogroup", () => {
  beforeEach(async () => {
    when(hasConfig)
      .calledWith("CIVICRM_API_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_SITE_KEY")
      .mockReturnValue(true);
    when(hasConfig)
      .calledWith("CIVICRM_API_URL")
      .mockReturnValue(true);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it("passes validation, and comes with standard action handler functionality", async () => {
    expect(() => validateActionHandler(HandlerToTest)).not.toThrowError();
    expect(() =>
      validateActionHandlerWithClientChoices(HandlerToTest)
    ).not.toThrowError();
    expect(HandlerToTest.name).toEqual("civicrm-addtogroup");
    expect(HandlerToTest.displayName()).toEqual("Add to CiviCRM group");
    expect(await HandlerToTest.processDeletedQuestionResponse()).toEqual(
      undefined
    );
    expect(HandlerToTest.clientChoiceDataCacheKey({ id: 1 })).toEqual("1");
  });

  describe("civicrm-addtogroup available()", () => {
    it("is available if the civicrm contact loader is available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("civicrm");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: true,
        expiresSeconds: 3600
      });
    });

    it("is not available if the civicrm contact loader is not available", async () => {
      when(getConfig)
        .calledWith("CONTACT_LOADERS")
        .mockReturnValue("");
      expect(await HandlerToTest.available({ id: 1 })).toEqual({
        result: false,
        expiresSeconds: 3600
      });
    });
  });

  describe("civicrm-addtag getClientChoiceData()", () => {
    it("returns successful data when data is available", async () => {
      const theGroupData = [
        { id: "2", title: "Administrators" },
        { id: "3", title: "Volunteers" },
        { id: "4", title: "Donors" },
        { id: "1", title: "Newsletter Subscribers" },
        { id: "5", title: "Volunteer" }
      ];

      when(searchGroups)
        .calledWith("")
        .mockResolvedValue(theGroupData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data:
          '{"items":[{"name":"Administrators","details":"2"},{"name":"Volunteers","details":"3"},{"name":"Donors","details":"4"},{"name":"Newsletter Subscribers","details":"1"},{"name":"Volunteer","details":"5"}]}',
        expiresSeconds: 3600
      });
    });

    it("returns successful data when data is empty", async () => {
      const theGroupData = [];

      when(searchGroups)
        .calledWith("")
        .mockResolvedValue(theGroupData);
      expect(await HandlerToTest.getClientChoiceData({ id: 1 })).toEqual({
        data: '{"items":[]}',
        expiresSeconds: 3600
      });
    });
  });
});
