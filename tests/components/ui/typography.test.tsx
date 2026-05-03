import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Typography } from "@/components/ui/typography";

describe("Typography", () => {
  it("renders common text variants", () => {
    render(
      <>
        <Typography.H1>Agency OS</Typography.H1>
        <Typography.P>Automate the repetitive work.</Typography.P>
        <Typography.Code>PADDLE_WEBHOOK_SECRET</Typography.Code>
      </>,
    );

    expect(screen.getByText("Agency OS")).toBeInTheDocument();
    expect(screen.getByText("Automate the repetitive work.")).toBeInTheDocument();
    expect(screen.getByText("PADDLE_WEBHOOK_SECRET")).toBeInTheDocument();
  });

  it("renders table helpers with valid table structure", () => {
    render(
      <Typography.Table>
        <Typography.TableHeader>
          <Typography.TableRow>
            <Typography.TableHead>Provider</Typography.TableHead>
          </Typography.TableRow>
        </Typography.TableHeader>
        <Typography.TableBody>
          <Typography.TableRow>
            <Typography.TableCell>Paddle</Typography.TableCell>
          </Typography.TableRow>
        </Typography.TableBody>
      </Typography.Table>,
    );

    expect(screen.getByRole("columnheader", { name: "Provider" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Paddle" })).toBeInTheDocument();
  });
});
