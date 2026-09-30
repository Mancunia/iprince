"use client";

import { useTranslations } from "next-intl";
import Corners from "./Corners";
import Icon from "./Icon";

// TODO: submit to Supabase `form_submissions` once the backend is wired up.
export default function ContactForm() {
  const t = useTranslations("home.contact.form");
  return (
    <form className="blueprint" style={{ display: "grid", gap: 18, padding: 28 }} onSubmit={(e) => e.preventDefault()}>
      <Corners />
      <div className="seg" role="radiogroup" aria-label={t("iAm")}>
        <label className="seg-opt">
          <input type="radio" name="who" value="candidate" defaultChecked />
          {t("candidate")}
        </label>
        <label className="seg-opt">
          <input type="radio" name="who" value="employer" />
          {t("employer")}
        </label>
      </div>
      <div className="field">
        <label className="label" htmlFor="c-name">
          {t("name")}
          <span className="req" aria-hidden="true">*</span>
        </label>
        <input className="input" id="c-name" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="c-mail">
          {t("email")}
          <span className="req" aria-hidden="true">*</span>
        </label>
        <input className="input" id="c-mail" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="c-msg">
          {t("message")}
        </label>
        <textarea className="textarea" id="c-msg" name="message" />
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span className="check-text">
          {t.rich("consent", { link: (chunks) => <a href="#">{chunks}</a> })}
        </span>
      </label>
      <button className="btn btn-primary btn-block" type="submit">
        {t("submit")}
      </button>
      <p className="security-note">
        <Icon name="lock" size="sm" />
        {t("security")}
      </p>
    </form>
  );
}
