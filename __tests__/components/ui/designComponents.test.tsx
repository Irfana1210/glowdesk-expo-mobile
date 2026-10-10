import { fireEvent, render, screen } from "@testing-library/react-native";

import { AttentionItem } from "@/components/ui/AttentionItem";
import { FilterChips } from "@/components/ui/FilterChips";
import { IconButton } from "@/components/ui/IconButton";
import { OrderCard } from "@/components/ui/OrderCard";
import { ProductRow } from "@/components/ui/ProductRow";
import { monogram } from "@/components/ui/ProductThumbnail";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { ShiftCard } from "@/components/ui/ShiftCard";
import { ShiftRow } from "@/components/ui/ShiftRow";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge", () => {
  it("always shows the status as text with a spoken label", async () => {
    await render(
      <StatusBadge
        icon="alert-circle-outline"
        label="Low stock"
        tone="lowStock"
      />,
    );
    expect(screen.getByLabelText("Status: Low stock")).toHaveTextContent(
      /Low stock/,
    );
  });
});

describe("FilterChips", () => {
  it("marks the selected chip and reports changes", async () => {
    const onChange = jest.fn();
    await render(
      <FilterChips
        accessibilityLabel="Filter"
        options={[
          { value: "ALL", label: "All", count: 17 },
          { value: "NEW", label: "New", count: 7 },
        ]}
        selected="ALL"
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId("filter-ALL")).toBeSelected();
    expect(screen.getByTestId("filter-NEW")).not.toBeSelected();
    await fireEvent.press(screen.getByTestId("filter-NEW"));
    expect(onChange).toHaveBeenCalledWith("NEW");
  });
});

describe("OrderCard", () => {
  it("shows the order, assignee and timing, and opens on press", async () => {
    const onPress = jest.fn();
    await render(
      <OrderCard
        overdue
        accessibilityLabel="Order 7841, Picking, Overdue 53 min, Jordan Lee"
        assigneeLabel="Jordan Lee"
        initials="J.L."
        orderNumber="7841"
        status={{ label: "Picking", icon: "basket-outline", tone: "picking" }}
        summary="5 items · placed 1:47 pm"
        testID="card"
        timingLabel="Overdue 53 min"
        onPress={onPress}
      />,
    );
    expect(screen.getByText("#ORD-7841")).toBeOnTheScreen();
    expect(screen.getByText("Overdue 53 min")).toBeOnTheScreen();
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId("card"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("ProductRow", () => {
  it("shows Verified or To scan in words", async () => {
    await render(
      <>
        <ProductRow
          accessibilityLabel="done"
          brand="Lumen Skin"
          detail="SKU LS-1042"
          name="Dewy Barrier Cream 50ml"
          quantity="1 / 1"
          seed="p1"
          testID="done"
          trailing={{ kind: "verified" }}
        />
        <ProductRow
          accessibilityLabel="todo"
          brand="Velour"
          detail="SKU VL-2210"
          name="Soft Focus Blush"
          quantity="0 / 2"
          seed="p2"
          testID="todo"
          trailing={{ kind: "toScan" }}
        />
      </>,
    );
    expect(screen.getByTestId("done")).toHaveTextContent(
      /LUMEN SKIN.*1 \/ 1.*Verified/,
    );
    expect(screen.getByTestId("todo")).toHaveTextContent(/0 \/ 2.*To scan/);
  });

  it("builds monograms the way the design shows them", () => {
    expect(
      ["LUMEN SKIN", "PETAL & PITH", "KŌRI", "Hearth & Hollow", "Velour"].map(
        monogram,
      ),
    ).toEqual(["LS", "P&P", "K", "H&H", "V"]);
  });
});

describe("ShiftCard", () => {
  it("exposes shift progress and figures", async () => {
    await render(
      <ShiftCard
        live
        headline="50m left"
        percent={90.2}
        stats={[{ value: "4", label: "on the floor" }]}
        statusLabel="On shift"
        timeRange="9:00 am – 5:30 pm"
      />,
    );
    expect(
      screen.getByRole("progressbar", { name: "Shift progress" }),
    ).toHaveAccessibilityValue({ now: 90 });
    expect(screen.getByLabelText("4 on the floor")).toBeOnTheScreen();
  });

  it("hides the progress bar when there is no shift to measure", async () => {
    await render(
      <ShiftCard
        headline="No shift today"
        live={false}
        percent={null}
        stats={[]}
        statusLabel="Not rostered"
        timeRange=""
      />,
    );
    expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
  });
});

describe("AttentionItem, ShiftRow, IconButton and ScreenTitle", () => {
  it("reads attention items as one sentence", async () => {
    const onPress = jest.fn();
    await render(
      <AttentionItem
        icon="time-outline"
        subtitle="Oldest 53 min past due"
        title="3 orders overdue"
        tone="overdue"
        onPress={onPress}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", {
        name: "3 orders overdue. Oldest 53 min past due",
      }),
    );
    expect(onPress).toHaveBeenCalled();
  });

  it("gives each shift row a named edit button", async () => {
    const onEdit = jest.fn();
    await render(
      <ShiftRow
        accessibilityLabel="Grace Liu"
        initials="GL"
        meta="30m break · 7.5h"
        name="Grace Liu"
        role="Beauty Advisor · Casual"
        stateLabel="Break at 5:00 pm"
        stateTone="warn"
        time="1:00 – 9:00 pm"
        onEdit={onEdit}
      />,
    );
    expect(screen.getByText("Break at 5:00 pm")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Edit shift for Grace Liu" }),
    );
    expect(onEdit).toHaveBeenCalled();
  });

  it("renders header pieces", async () => {
    await render(
      <ScreenTitle
        eyebrow="Click & Collect"
        right={
          <IconButton
            accessibilityLabel="Notifications, 3 unread"
            badge={3}
            icon="notifications-outline"
            onPress={jest.fn()}
          />
        }
        title="Orders"
      />,
    );
    expect(screen.getByRole("header", { name: "Orders" })).toBeOnTheScreen();
    expect(screen.getByText("Click & Collect")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Notifications, 3 unread" }),
    ).toHaveTextContent(/3/);
  });
});
