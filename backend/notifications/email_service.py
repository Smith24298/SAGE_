"""SMTP-based email notifications for event invitations."""

from __future__ import annotations

import os
import smtplib
import ssl
from html import escape
from datetime import datetime
from email.message import EmailMessage
from typing import Any

import certifi


def _env_bool(name: str, default: bool) -> bool:
    raw = str(os.getenv(name, "")).strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "y", "on"}


def _get_smtp_config() -> dict[str, Any]:
    host = str(os.getenv("SMTP_HOST", "")).strip()
    port_raw = str(os.getenv("SMTP_PORT", "587")).strip()
    try:
        port = int(port_raw)
    except ValueError:
        port = 587

    username = str(os.getenv("SMTP_USERNAME", "")).strip()
    password = str(os.getenv("SMTP_PASSWORD", ""))

    from_email = str(os.getenv("SMTP_FROM_EMAIL", username)).strip()
    from_name = str(os.getenv("SMTP_FROM_NAME", "SAGE HR")).strip() or "SAGE HR"
    reply_to = str(os.getenv("SMTP_REPLY_TO", "")).strip()

    use_tls = _env_bool("SMTP_USE_TLS", True)
    use_ssl = _env_bool("SMTP_USE_SSL", False)

    timeout_raw = str(os.getenv("SMTP_TIMEOUT_SECONDS", "20")).strip()
    try:
        timeout_seconds = float(timeout_raw)
    except ValueError:
        timeout_seconds = 20.0

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "from_name": from_name,
        "reply_to": reply_to,
        "use_tls": use_tls,
        "use_ssl": use_ssl,
        "timeout_seconds": timeout_seconds,
    }


def _tls_context() -> ssl.SSLContext:
    return ssl.create_default_context(cafile=certifi.where())


def smtp_is_configured() -> bool:
    cfg = _get_smtp_config()
    return bool(cfg["host"] and cfg["from_email"])


def _build_message(event_doc: dict[str, Any], recipient_email: str, recipient_name: str | None = None) -> EmailMessage:
    cfg = _get_smtp_config()

    event_title = str(event_doc.get("title") or "Company Event").strip()
    event_type = str(event_doc.get("type") or "HR Event").strip()
    event_date = str(event_doc.get("date") or "TBD").strip()
    event_time = str(event_doc.get("time") or "TBD").strip()
    event_location = str(event_doc.get("location") or "To be announced").strip()
    event_description = str(event_doc.get("description") or "").strip()
    event_attendees = str(event_doc.get("attendees") or "TBD").strip()
    event_link = str(event_doc.get("event_link") or "").strip()

    name = str(recipient_name or "").strip()
    greeting = f"Dear {name}," if name else "Dear Colleague,"

    subject = f"Official HR Invitation: {event_title} | {event_date} {event_time}"

    link_line = f"Join Link: {event_link}" if event_link else "Join Link: This will be shared by HR if applicable."

    plain_body = "\n".join(
        [
            greeting,
            "",
            "You are formally invited to attend the following HR event:",
            "",
            f"Event Title: {event_title}",
            f"Event Type: {event_type}",
            f"Date: {event_date}",
            f"Time: {event_time}",
            f"Location: {event_location}",
            f"Expected Attendees: {event_attendees}",
            link_line,
            "",
            "Description:",
            event_description or "No additional description was provided.",
            "",
            "Please consider this an official communication from the Human Resources team.",
            "Kindly ensure your attendance and be available on time.",
            "",
            "Regards,",
            f"{cfg['from_name']} Team",
        ]
    )

    safe_title = escape(event_title)
    safe_type = escape(event_type)
    safe_date = escape(event_date)
    safe_time = escape(event_time)
    safe_location = escape(event_location)
    safe_attendees = escape(event_attendees)
    safe_description = escape(event_description or "No additional description was provided.").replace("\n", "<br/>")
    safe_link = escape(event_link)
    link_html = (
        f'<a href="{safe_link}" target="_blank" rel="noopener noreferrer">Join Event</a>'
        if event_link
        else "This will be shared by HR if applicable."
    )

    html_body = (
        "<html><body style=\"font-family: Arial, sans-serif; color: #1f2937;\">"
        f"<p>{escape(greeting)}</p>"
        "<p>This is an official invitation from the Human Resources team for the following event.</p>"
        "<table style=\"border-collapse: collapse; width: 100%; max-width: 680px;\">"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db; width: 180px;\"><strong>Event Title</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_title}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Event Type</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_type}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Date</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_date}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Time</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_time}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Location</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_location}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Expected Attendees</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{safe_attendees}</td></tr>"
        "<tr><td style=\"padding: 8px; border: 1px solid #d1d5db;\"><strong>Join Link</strong></td>"
        f"<td style=\"padding: 8px; border: 1px solid #d1d5db;\">{link_html}</td></tr>"
        "</table>"
        f"<p style=\"margin-top: 14px;\"><strong>Description:</strong><br/>{safe_description}</p>"
        "<p>Please treat this as a formal HR communication and ensure timely participation.</p>"
        f"<p>Regards,<br/>{escape(cfg['from_name'])} Team</p>"
        "</body></html>"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    message["To"] = recipient_email
    if cfg["reply_to"]:
        message["Reply-To"] = cfg["reply_to"]
    message["Date"] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")
    message.set_content(plain_body)
    message.add_alternative(html_body, subtype="html")

    return message


def send_event_notifications(
    event_doc: dict[str, Any],
    recipients: list[dict[str, str]],
) -> dict[str, Any]:
    """Send invitation emails for an event to multiple recipients.

    recipients format: [{"email": "x@y.com", "name": "Optional Name"}, ...]
    """
    if not recipients:
        return {
            "status": "skipped",
            "reason": "No recipients provided",
            "requested": True,
            "configured": smtp_is_configured(),
            "total": 0,
            "sent_count": 0,
            "failed_count": 0,
            "results": [],
        }

    cfg = _get_smtp_config()
    if not smtp_is_configured():
        return {
            "status": "skipped",
            "reason": "SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL.",
            "requested": True,
            "configured": False,
            "total": len(recipients),
            "sent_count": 0,
            "failed_count": len(recipients),
            "results": [
                {
                    "email": item.get("email", ""),
                    "name": item.get("name", ""),
                    "status": "failed",
                    "error": "SMTP is not configured",
                }
                for item in recipients
            ],
        }

    results: list[dict[str, str]] = []
    sent_count = 0

    server = None
    try:
        if cfg["use_ssl"]:
            server = smtplib.SMTP_SSL(
                cfg["host"],
                cfg["port"],
                timeout=cfg["timeout_seconds"],
                context=_tls_context(),
            )
        else:
            server = smtplib.SMTP(
                cfg["host"],
                cfg["port"],
                timeout=cfg["timeout_seconds"],
            )
            server.ehlo()
            if cfg["use_tls"]:
                server.starttls(context=_tls_context())
                server.ehlo()

        if cfg["username"]:
            server.login(cfg["username"], cfg["password"])

        for recipient in recipients:
            email = str(recipient.get("email") or "").strip()
            name = str(recipient.get("name") or "").strip()
            if not email:
                results.append(
                    {
                        "email": "",
                        "name": name,
                        "status": "failed",
                        "error": "Missing email",
                    }
                )
                continue

            try:
                message = _build_message(event_doc, email, name)
                server.send_message(message)
                sent_count += 1
                results.append(
                    {
                        "email": email,
                        "name": name,
                        "status": "sent",
                        "error": "",
                    }
                )
            except Exception as exc:
                results.append(
                    {
                        "email": email,
                        "name": name,
                        "status": "failed",
                        "error": str(exc),
                    }
                )

    except Exception as exc:
        return {
            "status": "failed",
            "reason": str(exc),
            "requested": True,
            "configured": True,
            "total": len(recipients),
            "sent_count": 0,
            "failed_count": len(recipients),
            "results": [
                {
                    "email": item.get("email", ""),
                    "name": item.get("name", ""),
                    "status": "failed",
                    "error": str(exc),
                }
                for item in recipients
            ],
        }
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass

    failed_count = max(0, len(results) - sent_count)
    status = "success" if failed_count == 0 else ("partial" if sent_count > 0 else "failed")

    return {
        "status": status,
        "reason": "",
        "requested": True,
        "configured": True,
        "total": len(recipients),
        "sent_count": sent_count,
        "failed_count": failed_count,
        "results": results,
    }
